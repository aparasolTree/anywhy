import { define } from "../../../utils/define.ts";
import { formDataVerify } from "../../../utils/formDataVerify.ts";
import { clearImageKvData } from "../../../utils/kv/image.kv.ts";
import { createAdmin } from "../../../utils/kv/index.ts";
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
            case "all":
                await clearUserKvData();
                await createAdmin();
                await clearImageKvData();
                break;
            case "image":
                await clearImageKvData();
                break;
            default:
                return badRequest(`${clear}数据不存在`);
        }
        return json({ ok: true });
    },
});
