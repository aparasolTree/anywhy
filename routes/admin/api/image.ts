import { define } from "../../../utils/define.ts";
import { getImageEntries, getImageTotal } from "../../../utils/kv/image.kv.ts";
import { clamp, filterCommandArgsReg, removeQuoteReg, validateNumber } from "../../../utils/common.ts";
import { badRequest, json } from "../../../utils/response.ts";
import { ImageEntry } from "../../../utils/type.ts";

// deno-lint-ignore no-explicit-any
type PickNumberValue<T extends Record<any, any>> = {
    [K in keyof T as T[K] extends number ? K : never]: T[K];
};

type Sort = keyof PickNumberValue<ImageEntry>;
type Order = "asc" | "des";
interface ImageSearchParams {
    page?: string;
    limit?: string;
    search?: string;
    sort?: Sort;
    order?: Order;
    filter?: string;
}

const AccessOrder: Order[] = ["asc", "des"];
const AccessSort: Sort[] = ["createAt", "downloads", "height", "size", "views", "width"];

const operatorFnMap = {
    ">": (val: number, condition: number) => val > condition,
    "<": (val: number, condition: number) => val < condition,
    "!=": (val: number, condition: number) => val !== condition,
    "==": (val: number, condition: number) => val === condition,
    ">=": (val: number, condition: number) => val >= condition,
    "<=": (val: number, condition: number) => val <= condition,
};
const returnTrue = () => true;
const returnFalse = () => false;
function createFilter<T>(filter: string) {
    if (!filter.length) return returnTrue;
    const filters = filter.replaceAll(removeQuoteReg, "$2").split("&").filter(Boolean);
    if (!filters.length) return returnFalse;
    if (!filters.every((f) => filterCommandArgsReg.test(f))) throw new Error("filter 参数格式错误");
    return (entry: T) => {
        return filters.every((f) => {
            const match = filterCommandArgsReg.exec(f)!;
            const [_, key, operator, condition] = match;
            const type = typeof entry[key as keyof T];
            if (type !== "number") throw badRequest(`运算符‘${operator}’不能应用于‘${type}’和‘数字’类型`);
            return operatorFnMap[operator as keyof typeof operatorFnMap](
                entry[key as keyof T] as number,
                Number(condition),
            );
        });
    };
}

export const handler = define.handlers(async ({ url }) => {
    const { page = "1", limit = "8", sort = "createAt", order = "des", filter = "" } = Object
        .fromEntries(url.searchParams) as unknown as ImageSearchParams;

    const pageNum = clamp(validateNumber(page, "page"), 1, Infinity);
    const limitNum = clamp(validateNumber(limit, "limit"), 1, 100);
    if ((pageNum - 1) * limitNum > await getImageTotal()) return badRequest("查询的数据范围超过已有的最大范围");

    if (order && !AccessOrder.includes(order)) return badRequest("order 参数不支持 " + order);
    if (sort && !AccessSort.includes(sort)) return badRequest("sort 参数不支持 " + sort);

    const doFilter = createFilter<ImageEntry>(filter);
    const { data: imageEntries, total } = await getImageEntries({
        filter: doFilter,
        pipe: [
            (entries) => entries.toSorted((a, b) => (order === "des") ? (b[sort] - a[sort]) : (a[sort] - b[sort])),
            (entries) => entries.slice((pageNum - 1) * limitNum, pageNum * limitNum),
        ],
    });
    return json({
        total,
        imageEntries,
        page: pageNum,
        limit: limitNum,
        done: total <= (pageNum * limitNum),
    });
});
