import { extname } from "@std/path/extname";
import { define } from "../../utils/define.ts";
import { getImageEntryByName, setImageDownloads } from "../../utils/kv/image.kv.ts";
import { imageCache } from "../../utils/image-cache.ts";
import { HttpError } from "fresh";
import { getUserSession } from "../../utils/user.session.ts";
import { isProhibited, remoteAddreeAccessRestrict } from "../../utils/kv/access.kv.ts";
import { badRequest } from "../../utils/response.ts";
import { getImage } from "../../utils/image.ts";
import { getFile } from "../../utils/file_upload_local_test/get.ts";
import { getEnvVar } from "../../utils/common.ts";

const dev = getEnvVar("ANYWHY_DEV");
const randomName = () => Math.random().toString(16).slice(2);
export const handler = define.handlers(async ({ params, url, req, info }) => {
    const imageEntry = await getImageEntryByName(params.name);
    if (!imageEntry) throw new HttpError(404);

    const { getUser } = await getUserSession(req);
    const isAdmin = (await getUser())?.role === "admin";
    const address = (info.remoteAddr as Deno.NetAddr).hostname;
    if (await isProhibited(address) && !isAdmin) {
        return badRequest("在固定时间内访问次数过高，10分钟后重试。", { status: 423 });
    }
    await remoteAddreeAccessRestrict(address);

    const has = await imageCache.has(req);
    const response = !has
        ? dev ? await getFile(params.name) : await getImage(params.name)
        : (await imageCache.get(req))!;
    if (!has) await imageCache.set(req, response.clone());

    const { action } = Object.fromEntries(url.searchParams);
    if (action === "downloads") {
        await setImageDownloads(imageEntry.id);
        response.headers.set(
            "Content-Disposition",
            `attachment; filename="anywhy-${randomName()}${extname(params.name)}"`,
        );
    }
    return response;
});
