import AliOss from "npm:ali-oss";
import { getEnvVar } from "./common.ts";
import { Buffer } from "node:buffer";
import { Readable } from "node:stream";
import { typeByExtension } from "@std/media-types";
import { extname } from "@std/path";

const client = new AliOss({
    region: getEnvVar("ALIYUN_REGOIN"),
    bucket: "xlimages",
    authorizationV4: true,
    accessKeyId: getEnvVar("ALIYUN_ACCESS_KEY_ID"),
    accessKeySecret: getEnvVar("ALIYUN_ACCESS_KEY_SECRET"),
});

export const IMAGES_DIR = "images/";
export async function putFile(name: string, data: File) {
    const uInt8Array = await data.bytes();
    const result = await client.put(IMAGES_DIR + name, Buffer.from(uInt8Array));
    return result;
}

export async function getImage(name: string) {
    const result = await client.getStream(IMAGES_DIR + name);
    const originHeaders = result.res.headers;
    const headers = new Headers([
        ["Content-Type", typeByExtension(extname(name)) || "image/jpeg"],
        ["Content-Length", originHeaders["content-length"]],
        ["Cache-Control", "public, max-age=31536000"],
    ]);

    return new Response(Readable.toWeb(result.stream) as ReadableStream, {
        headers,
    });
}
