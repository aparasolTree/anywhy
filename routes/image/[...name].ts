import { extname } from "@std/path/extname";
import { define } from "../../utils/define.ts";
import { getImageEntry, setImageDownloads } from "../../utils/kv/image.kv.ts";
import { createImageCache } from "../../utils/image-cache.ts";
import { RouteConfig } from "fresh";
import { getUserSession } from "../../utils/user.session.ts";
import { isProhibited, remoteAddreeAccessRestrict } from "../../utils/kv/access.kv.ts";
import { badRequest } from "../../utils/response.ts";
import { getImage } from "../../utils/image.ts";
// import { getFile } from "../../utils/file_upload_local_test/get.ts";

const randomName = () => Math.random().toString(16).slice(2);
export const cache = await createImageCache({ expireIn: 1000 * 60 * 60 * 24 });

export const handler = define.handlers(async ({ params, url, req, info }) => {
    const { getUser } = await getUserSession(req);
    const isAdmin = (await getUser())?.role === "admin";
    const remoteAdd = info.remoteAddr as Deno.NetAddr;
    const address = remoteAdd.hostname;
    if (await isProhibited(address) && !isAdmin) {
        return badRequest("在固定时间内访问次数过高，10分钟后重试。", { status: 423 });
    }
    await remoteAddreeAccessRestrict(address);
    const imageName = params.name;
    const { action, id } = Object.fromEntries(url.searchParams);
    const has = await cache.has(req);
    const response = !has ? await getImage(imageName) : (await cache.get(req))!;
    if (!has) await cache.set(req, response.clone());
    if (action === "downloads" && await getImageEntry(id)) {
        await setImageDownloads(id);
        response.headers.set(
            "Content-Disposition",
            `attachment; filename="anywhy-${randomName()}${extname(imageName)}"`,
        );
    }
    return response;
});

export const config: RouteConfig = {
    skipAppWrapper: true,
    skipInheritedLayouts: true,
};
