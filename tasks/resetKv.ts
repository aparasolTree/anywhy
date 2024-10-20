import { kv } from "../utils/kv/index.ts";

export async function resetKv() {
    const list = kv.list({ prefix: [] });
    let atomic = kv.atomic();
    for await (const { key } of list) {
        atomic = atomic.delete(key);
    }
    await atomic.commit();
}

await resetKv();
