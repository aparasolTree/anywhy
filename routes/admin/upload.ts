import { extname } from "@std/path";
import { monotonicUlid } from "@std/ulid";
import { define } from "../../utils/define.ts";
import { badRequest, redirect } from "../../utils/response.ts";
import { putFile } from "../../utils/image.ts";
import { createImage, createImageEntry, readImageExif } from "../../utils/kv/image.kv.ts";
import { formDataVerify } from "../../utils/formDataVerify.ts";
// import { upload } from "../../utils/file_upload_local_test/upload.ts";

export const handler = define.handlers({
    async POST({ req }) {
        const [error, { images }] = formDataVerify(await req.formData(), {
            images: { type: "Files", required: true, size: 700000, maxLength: 10, extname: [".jpg", ".jpeg"] },
        });
        if (error) return badRequest(error);

        for (const file of images) {
            const res = await putFile(monotonicUlid() + extname(file.name), file);
            const name = res.name.split(/\\|\//).pop()!;
            const { exif, imageSize } = await readImageExif(await file.arrayBuffer());
            await createImage(createImageEntry({
                size: file.size,
                name,
                exif,
                ...imageSize,
            }));
        }
        return redirect("/admin");
    },
});
