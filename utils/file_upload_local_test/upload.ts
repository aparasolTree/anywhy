import { ensureDir } from "@std/fs";
import { join } from "@std/path";

export async function upload(name: string, file: File) {
    const uploadPath = new URL("../../upload", import.meta.url);
    await ensureDir(uploadPath);
    await Deno.writeFile(join(uploadPath, name), await file.bytes());
    return {
        name,
    };
}
