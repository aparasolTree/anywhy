import { walk } from "@std/fs";
import { ANYWHY_BLOG_FILE_DIR_PATH } from "./constant.ts";
import { extract } from "@std/front-matter/yaml";
import { join } from "@std/path";

type BlogEntry = { filename: string; path: string; attrs: BlogAttrs };
type BlogPath = string;
type BlogTagName = string;

const cachedBlogTagNames = new Set<string>();
const cachedBlogList = new Map<BlogTagName, BlogPath[]>();
const cachedBlog = new Map<BlogPath, BlogEntry>();
let cachedBlogTotal = 0;

export type BlogAttrs = {
    title: string;
    bannerSrc: string;
    description: string;
    tags: string[];
    date: Date;
    meta?: Record<string, string>;
    bannerAuthor?: string;
};

export type BlogList = {
    total: number;
    tags: { tag: string; total: number }[];
    blogs: BlogEntry[];
};

function getBlogCache(tag?: string) {
    return {
        total: cachedBlogTotal,
        tags: [...cachedBlogTagNames].map((tag) => ({ tag, total: cachedBlogList.get(tag)?.length || 0 })),
        blogs: tag
            ? (cachedBlogList.get(tag) || [])
                ?.map((p) => cachedBlog.get(p))
                .filter(Boolean) as BlogEntry[]
            : [...cachedBlog.values()].flat(),
    };
}

const OTHER_TAG = "其他";
let isCached = false;

export async function getBlogList(tag?: string) {
    if (isCached) return getBlogCache(tag);

    const floder = walk(ANYWHY_BLOG_FILE_DIR_PATH, { maxDepth: 1, includeFiles: false });
    for await (const { name, path } of floder) {
        if (name === "doc") continue;
        const markdown = await Deno.readTextFile(join(path, "index.md"));
        const { attrs } = extract<BlogAttrs>(markdown);
        (attrs.tags || [OTHER_TAG]).forEach((val) => {
            cachedBlogTagNames.add(val);
            let entries = cachedBlogList.get(val);
            if (!entries) cachedBlogList.set(val, entries = []);
            entries.push(path);
        });
        cachedBlogTotal++;
        cachedBlog.set(path, {
            attrs: {
                ...attrs,
                tags: ["all", ...attrs.tags],
            },
            filename: name,
            path,
        });
    }
    isCached = true;
    return getBlogCache(tag);
}
