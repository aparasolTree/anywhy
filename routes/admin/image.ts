import { define } from "../../utils/define.ts";
import { formDataVerify } from "../../utils/formDataVerify.ts";
import { deleteImages, getImageEntry } from "../../utils/kv/image.kv.ts";
import { badRequest, json } from "../../utils/response.ts";

export const handler = define.handlers({
    async POST({ req }) {
        const [error, { id }] = formDataVerify(await req.formData(), {
            id: { type: "String", required: true },
        });
        if (error) return badRequest(error);

        const imageEntry = await getImageEntry(id);
        if (!imageEntry) return badRequest("图片不存在");
        await deleteImages([id]);
        return json({ ok: true });
    },
});
