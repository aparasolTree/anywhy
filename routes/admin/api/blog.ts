import { getBlogList } from "../../../utils/blog.ts";
import { clamp, validateNumber } from "../../../utils/common.ts";
import { define } from "../../../utils/define.ts";
import { getBlogViews } from "../../../utils/kv/blog.kv.ts";
import { badRequest, json } from "../../../utils/response.ts";

export const handler = define.handlers(async ({ url }) => {
    const { page = "1", limit = "1" } = Object.fromEntries(url.searchParams);
    const pageNum = clamp(validateNumber(page, "page"), 0, Infinity);
    const limitNum = clamp(validateNumber(limit, "limit"), 0, 100);
    const { blogs, total } = await getBlogList();
    if (total <= (pageNum - 1) * limitNum) return badRequest("查询的数据范围已超过已有数据的最大范围");
    const list = await Promise.all(blogs.map(async ({ filename }) => ({
        title: filename,
        views: await getBlogViews(filename),
    })));

    return json({
        total,
        page: pageNum,
        limit: limitNum,
        list: list
            .toSorted((a, b) => b.views - a.views)
            .slice((pageNum - 1) * limitNum, pageNum * limitNum),
    });
});
