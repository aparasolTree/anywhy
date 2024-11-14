import { extname } from "@std/path";
import { monotonicUlid } from "@std/ulid";
import { define } from "../../utils/define.ts";
import { badRequest, json } from "../../utils/response.ts";
import { putFile } from "../../utils/image.ts";
import { createImage, createImageEntry, readImageExif } from "../../utils/kv/image.kv.ts";
import { formDataVerify } from "../../utils/formDataVerify.ts";
import { upload } from "../../utils/file_upload_local_test/upload.ts";
import { getEnvVar } from "../../utils/common.ts";
import { join } from "@std/path/join";
import { addToNotification, NotifyImagesData } from "../../utils/kv/notify.ts";

const dev = getEnvVar("ANYWHY_DEV");

export const handler = define.handlers({
    async POST({ req, url }) {
        const [error, { images }] = formDataVerify(await req.formData(), {
            images: { type: "Files", required: true, size: 1024 * 1024, maxLength: 6, extname: [".jpg", ".jpeg"] },
        });
        if (error) return badRequest(error);
        const latestUploadImages: NotifyImagesData[] = [];
        for (const file of images) {
            const fileName = monotonicUlid() + extname(file.name);
            const res = dev ? await upload(fileName, file) : await putFile(fileName, file);
            const name = res.name.split(/\\|\//).pop()!;
            const { exif, imageSize } = await readImageExif(await file.arrayBuffer());
            latestUploadImages.push({ src: new URL(join("image", name), url.origin).toString(), ...imageSize });
            await createImage(createImageEntry({
                size: file.size,
                name,
                exif,
                ...imageSize,
            }));
        }
        await addToNotification(latestUploadImages);
        return json({ ok: true });
    },
});
