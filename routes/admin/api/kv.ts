import { define } from "../../../utils/define.ts";
import { formDataVerify } from "../../../utils/formDataVerify.ts";
import { imageDataCache } from "../../../utils/image-data-cache.ts";
import { clearImageKvData } from "../../../utils/kv/image.kv.ts";
import { createAdmin, kv } from "../../../utils/kv/index.ts";
import { clearUserKvData } from "../../../utils/kv/user.kv.ts";
import { badRequest, json } from "../../../utils/response.ts";

export const handler = define.handlers({
    async POST({ req }) {
        const [error, { clear }] = formDataVerify(await req.formData(), {
            clear: { type: "String", required: true },
        });
        if (error) return badRequest(error);
        switch (clear) {
            case "user":
                await clearUserKvData();
                await createAdmin();
                break;
            case "all": {
                const list = kv.list({ prefix: [] });
                let atomic = kv.atomic();
                for await (const { key } of list) {
                    atomic = atomic.delete(key);
                }
                await atomic.commit();
                break;
            }
            case "image":
                await clearImageKvData();
                await imageDataCache.clear();
                break;
            default:
                return badRequest(`${clear}数据不存在`);
        }
        return json({ ok: true });
    },
});
