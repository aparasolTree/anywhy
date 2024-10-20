import { RouteConfig } from "fresh";
import { define } from "../../../utils/define.ts";
import { getImageDataCacheSpace, imageDataCache, setImageDataCacheSpace } from "../../../utils/image-data-cache.ts";
import { badRequest, json } from "../../../utils/response.ts";
import { formDataVerify } from "../../../utils/formDataVerify.ts";

export const handler = define.handlers({
    async GET() {
        const [size, total] = await imageDataCache.getCachedInfo();
        return json({
            size: Number(size.value),
            total: Number(total.value),
            space: await getImageDataCacheSpace(),
        });
    },

    async POST({ req }) {
        const [error, { space }] = formDataVerify(await req.formData(), {
            space: { type: "String", required: true, custom: (_, val) => /^((-|\+)(\d+))$/.test(val) ? "" : "space: 格式错误，" + val },
        });
        if (error) return badRequest(error);
        await setImageDataCacheSpace(Number(space));
        return json({ ok: true });
    },
});

export const config: RouteConfig = {
    routeOverride: "/admin/api/image/cache",
};
