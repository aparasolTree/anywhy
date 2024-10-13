import { getValue, getValues, kv } from "./index.ts";
import { formatDate } from "../formatDate.ts";
import {
    ANYWHY_ACCESS_ADDRESS_KEY,
    ANYWHY_ACCESS_DATE_KEY,
    ANYWHY_ACCESS_EXPIREIN_KEY,
    ANYWHY_ACCESS_KEY,
    ANYWHY_ACCESS_RESTRICT_COUNT,
    ANYWHY_ACCESS_RESTRICT_EXPIRES,
    ANYWHY_ACCESS_RESTRICT_KEY,
    ANYWHY_ACCESS_TOTAL_KEY,
    ANYWHY_ACCESS_USER_KEY,
    ANYWHY_KV_KEY,
} from "../constant.ts";
import { badRequest } from "../response.ts";

export async function setAccess() {
    const [year, month] = formatDate(new Date(), "YYYY/MM").split("/");
    await kv.atomic()
        .sum([ANYWHY_KV_KEY, ANYWHY_ACCESS_KEY, ANYWHY_ACCESS_TOTAL_KEY], 1n)
        .sum([ANYWHY_KV_KEY, ANYWHY_ACCESS_KEY, ANYWHY_ACCESS_DATE_KEY, year, month], 1n)
        .commit();
}

export async function setUserAccess(id: string, count = 1n) {
    const UserAccessKey = [ANYWHY_KV_KEY, ANYWHY_ACCESS_KEY, ANYWHY_ACCESS_USER_KEY, id];
    const { ok } = await kv.atomic()
        .check({ key: UserAccessKey, versionstamp: null })
        .sum(UserAccessKey, count)
        .commit();
    if (!ok) {
        throw badRequest("数据可能已经存在或者id=" + id + "错误");
    }
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

export async function remoteAddreeAccessRestrict(remoteAddree: string) {
    const AccessRestrictKey = [ANYWHY_KV_KEY, ANYWHY_ACCESS_KEY, ANYWHY_ACCESS_RESTRICT_KEY, remoteAddree];
    const AccessAddressKey = [ANYWHY_KV_KEY, ANYWHY_ACCESS_KEY, ANYWHY_ACCESS_ADDRESS_KEY, remoteAddree];
    const AccessExpiresInKey = [ANYWHY_KV_KEY, ANYWHY_ACCESS_KEY, ANYWHY_ACCESS_EXPIREIN_KEY, remoteAddree];

    await kv.atomic()
        .check({ key: AccessExpiresInKey, versionstamp: null })
        .set(AccessExpiresInKey, Date.now() + ANYWHY_ACCESS_RESTRICT_EXPIRES)
        .commit();

    await kv.atomic()
        .sum(AccessRestrictKey, 1n)
        .sum(AccessAddressKey, 1n)
        .commit();

    const [expireIn, count] = await getValues<[number, Deno.KvU64]>([AccessExpiresInKey, AccessRestrictKey]);
    if (expireIn && expireIn <= Date.now()) {
        await kv.atomic()
            .delete(AccessRestrictKey)
            .delete(AccessExpiresInKey)
            .commit();
        if (count.value >= ANYWHY_ACCESS_RESTRICT_COUNT) {
            await setProhibited(remoteAddree);
        }
    }
}

const ANYWHY_ACCESS_PROHIBITED_KEY = "ANYWHY_ACCESS_PASS_KEY";
const ANYWHY_ACCESS_PROHIBITED_EXPIRES = 1000 * 10 * 60;

export async function isProhibited(remoteAddree: string) {
    const AccessPassKey = [
        ANYWHY_KV_KEY,
        ANYWHY_ACCESS_KEY,
        ANYWHY_ACCESS_PROHIBITED_KEY,
        remoteAddree,
    ];
    const isPassEnter = await getValue<boolean>(AccessPassKey);
    return isPassEnter;
}

export async function setProhibited(remoteAddree: string) {
    const AccessPassKey = [
        ANYWHY_KV_KEY,
        ANYWHY_ACCESS_KEY,
        ANYWHY_ACCESS_PROHIBITED_KEY,
        remoteAddree,
    ];
    await kv.atomic()
        .check({ key: AccessPassKey, versionstamp: null })
        .set(AccessPassKey, true, {
            expireIn: ANYWHY_ACCESS_PROHIBITED_EXPIRES,
        })
        .commit();
}
