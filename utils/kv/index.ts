import { getEnvVar, pipeline } from "../common.ts";
import { getCacheByKvKey, setCacheByKvKey } from "../kv-cache.ts";
import { createUser, createUserEntry, getUserFromEmail } from "./user.kv.ts";

export const kv = await Deno.openKv();

export async function createAdmin() {
    const adminEmailAddress = getEnvVar("ADMIN_EMAIL");
    const user = await getUserFromEmail(adminEmailAddress);
    if (!user) {
        await createUser(
            createUserEntry(
                adminEmailAddress,
                getEnvVar("ADMIN_NAME"),
                "admin",
            ),
        );
    }
}

export async function getValue<T>(key: Deno.KvKey, options?: {
    consistency?: Deno.KvConsistencyLevel;
}) {
    const { value } = await kv.get<T>(key, options);
    return value;
}

// deno-lint-ignore no-explicit-any
export async function getValues<T extends any[]>(keys: { [K in keyof T]: Deno.KvKey }, options?: {
    consistency?: Deno.KvConsistencyLevel;
}) {
    const values = await kv.getMany<T>(keys, options);
    return values.map(({ value }) => value) as T;
}

export interface ListOptions<A, R> extends Deno.KvListOptions {
    map?: (arg: A) => Promise<R> | R | A;
    filter?: (entry: R) => boolean;
    pipe?: ((val: R[]) => R[])[];
}

export async function list<R, A = R>(
    prefix: Deno.KvKey,
    options: ListOptions<A, R>,
) {
    const { map = (v) => v, filter = () => true, pipe = [], ...other } = options;
    const imageEntries: A[] = getCacheByKvKey(prefix) || [];
    if (!imageEntries.length) {
        const entryList = kv.list<A>({ prefix }, other);
        for await (const { value } of entryList) {
            imageEntries.push(value);
        }
        setCacheByKvKey(prefix, imageEntries);
    }
    const data = await Promise.all(imageEntries.map(map)) as R[];
    const result = data.filter(filter);
    return {
        data: pipeline(result, pipe),
        total: result.length,
    };
}
