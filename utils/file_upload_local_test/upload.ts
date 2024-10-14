import { ensureDir } from "@std/fs";
import { fromFileUrl } from "@std/path";

export async function upload(name: string, file: File) {
    const uploadPath = new URL("../../upload/", import.meta.url);
    try {
        await ensureDir(uploadPath);
        await Deno.writeFile(`${fromFileUrl(uploadPath)}${name}`, file.stream());
    } catch (error) {
        console.log(error);
    }
    return {
        name,
    };
}
