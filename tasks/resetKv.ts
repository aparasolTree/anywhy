import { kv } from "../utils/kv/index.ts";

export async function resetKv() {
    const list = kv.list({ prefix: [] });
    for await (const { key } of list) {
        await kv.delete(key);
    }
}

await resetKv();
