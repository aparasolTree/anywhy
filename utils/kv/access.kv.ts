import { formatDate } from "../formatDate.ts";
import { ANYWHY_ACCESS_DATE_KEY, ANYWHY_ACCESS_KEY, ANYWHY_ACCESS_TOTAL_KEY, ANYWHY_KV_KEY } from "../constant.ts";
import { kv } from "./index.ts";

export async function setAccess() {
    const [year, month] = formatDate(new Date(), "YYYY/MM").split("/");
    await kv.atomic()
        .sum([ANYWHY_KV_KEY, ANYWHY_ACCESS_KEY, ANYWHY_ACCESS_TOTAL_KEY], 1n)
        .sum([ANYWHY_KV_KEY, ANYWHY_ACCESS_KEY, ANYWHY_ACCESS_DATE_KEY, year, month], 1n)
        .commit();
}

export async function getAccess() {
    const [year, month] = formatDate(new Date(), "YYYY/MM").split("/");
    const queryKeys: Deno.KvKey[] = [
        [ANYWHY_KV_KEY, ANYWHY_ACCESS_KEY, ANYWHY_ACCESS_TOTAL_KEY],
        [ANYWHY_KV_KEY, ANYWHY_ACCESS_KEY, ANYWHY_ACCESS_DATE_KEY, year, month],
    ];

    const [totalAccess, monthAccess] = (await kv.getMany<Deno.KvU64[]>(queryKeys))
        .map(
            ({ value }) => Number(value?.value || 0),
        );

    return {
        totalAccess,
        monthAccess,
    };
}

export type MonthsAccess = { month: string; access: number }[];
export async function getMonthsAccess(year = new Date().getFullYear()) {
    const monthAccessKey = [
        ANYWHY_KV_KEY,
        ANYWHY_ACCESS_KEY,
        ANYWHY_ACCESS_DATE_KEY,
        String(year),
    ];
    const list = kv.list<Deno.KvU64>({ prefix: monthAccessKey });
    const result: MonthsAccess = [];
    for await (const { value, key } of list) {
        result.push({ month: key.at(-1) as string, access: Number(value) });
    }
    return result;
}
