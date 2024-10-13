import { ANYWHY_KV_BLOG_KEY, ANYWHY_KV_BLOG_VIEWS_KEY, ANYWHY_KV_KEY } from "../constant.ts";
import { getValue, kv } from "./index.ts";

export async function setBlogViews(name: string, count = 1n) {
    const BlogAccessKey = [ANYWHY_KV_KEY, ANYWHY_KV_BLOG_KEY, ANYWHY_KV_BLOG_VIEWS_KEY, name];
    await kv.atomic()
        .sum(BlogAccessKey, count)
        .commit();
}

export async function getBlogViews(name: string) {
    const BlogAccessKey = [ANYWHY_KV_KEY, ANYWHY_KV_BLOG_KEY, ANYWHY_KV_BLOG_VIEWS_KEY, name];
    return Number(
        (await getValue<Deno.KvU64>(BlogAccessKey))?.value || 0,
    );
}
