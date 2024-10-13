import { exists } from "@std/fs";
import { extname, join } from "@std/path";
import { typeByExtension } from "@std/media-types/type-by-extension";
import { HttpError } from "fresh";

export async function getFile(name: string) {
    const filePath = new URL(join("../../upload/", name), import.meta.url);
    if (await exists(filePath)) {
        const file = await Deno.open(filePath);
        const headers = new Headers([
            ["Content-Type", typeByExtension(extname(name)) || "image/jpeg"],
            ["Content-Length", `${(await Deno.stat(filePath)).size}`],
            ["Cache-Control", "public, max-age=31536000"],
        ]);
        return new Response(file.readable, {
            headers,
        });
    }
    throw new HttpError(404);
}
