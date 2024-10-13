import { clamp, validateNumber } from "../../../utils/common.ts";
import { define } from "../../../utils/define.ts";
import { getUsers, getUserTotal } from "../../../utils/kv/user.kv.ts";
import { badRequest, json } from "../../../utils/response.ts";

export const handler = define.handlers(async ({ url }) => {
    const { page = "1", limit = "1" } = Object.fromEntries(url.searchParams);
    const pageNum = clamp(validateNumber(page, "page"), 1, Infinity);
    const limitNum = clamp(validateNumber(limit, "limit"), 1, 100);
    if ((pageNum - 1) * limitNum >= await getUserTotal()) return badRequest("查询的数据范围超过已有的最大范围");
    const { data, total } = await getUsers({
        pipe: [
            (entries) => entries.toSorted((a, b) => a.createAt - b.createAt),
            (entries) => entries.slice((pageNum - 1) * limitNum, pageNum * limitNum),
        ],
    });

    return json({
        total,
        list: data,
        page: pageNum,
        limit: limitNum,
    });
});
