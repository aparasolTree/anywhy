import { define } from "../../utils/define.ts";
import { formDataVerify } from "../../utils/formDataVerify.ts";
import { deleteImages, getImageEntryByName } from "../../utils/kv/image.kv.ts";
import { badRequest, json } from "../../utils/response.ts";

export const handler = define.handlers({
    async POST({ req }) {
        const [error, { name }] = formDataVerify(await req.formData(), {
            name: { type: "String", required: true },
        });
        if (error) return badRequest(error);

        const imageEntry = await getImageEntryByName(name);
        if (!imageEntry) return badRequest("图片不存在");
        await deleteImages([imageEntry.id]);
        return json({ ok: true });
    },
});
