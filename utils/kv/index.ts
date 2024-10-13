import { getEnvVar, pipeline } from "../common.ts";
import { createUser, createUserEntry, getUserFromEmail } from "./user.kv.ts";

export const kv = await Deno.openKv("./anywhy.db");

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
    map?: (arg: A, key: Deno.KvKey) => Promise<R> | R | A;
    filter?: (val: R) => boolean;
    pipe?: ((val: R[]) => R[])[];
}

export async function list<R, A = R>(
    prefix: Deno.KvKey,
    options: ListOptions<A, R>,
) {
    const { filter = () => true, map = (v) => v, pipe = [], ...other } = options;
    const entryList = kv.list<A>({ prefix }, other);
    const result: R[] = [];

    let cursorIndex: number = 0;
    for await (const { value, key } of entryList) {
        const newValue = (await map(value, key)) as R;
        if (!filter(newValue)) continue;
        result.push(newValue);
        cursorIndex++;
    }

    return {
        data: pipeline(result, pipe),
        total: cursorIndex,
    };
}
