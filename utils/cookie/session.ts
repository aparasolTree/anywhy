import { CookieOptions, createCookie } from "./cookie.ts";

export type SessionData = Record<string, unknown>;
export interface Session<
    T extends SessionData,
    K extends keyof T & string = keyof T & string,
> {
    readonly id: string;
    readonly data: T;
    get(key: K): T[K] | undefined;
    delete(key: K): void;
    clean(): void;
    has(key: K): boolean;
    set(key: K, value: T[K], opts?: { once?: boolean }): void;
}

export interface CookieSession<T extends SessionData> {
    getSession(cookieHeader?: string | null): Promise<Session<T>>;
    commitSession(
        session: Session<T>,
        options?: CookieOptions,
    ): Promise<string>;
    destorySession(
        session?: Session<T>,
        options?: CookieOptions,
    ): Promise<string>;
}

export interface FactoryMethds<T> {
    cookies: { name: string; options?: CookieOptions };
    read(id: string): Promise<T | null> | (T | null);
    write(value: T, expires?: Date): Promise<string> | string;
    update(id: string, value: T, expires?: Date): Promise<void> | void;
    destory(id: string): Promise<void> | void;
}

const MAX_COOKIE_SIZE = 4096;
export function createCookieSessionFactory<T extends SessionData>(
    options: FactoryMethds<T>,
): CookieSession<T> {
    const { destory, read, update, write, cookies } = options;
    const { name, options: cookieOptions } = cookies;
    const cookie = createCookie<string>(name, cookieOptions);
    return {
        getSession: async (cookieHeader) => {
            const sessionId = await cookie.parse(cookieHeader);
            if (sessionId) {
                const session = await read(sessionId);
                return createSession<T>(session || {} as T, sessionId);
            }
            return createSession<T>({} as T);
        },
        commitSession: async ({ data, id }, cookieOpts) => {
            const expires = cookieOpts?.maxAge
                ? new Date(Date.now() + cookieOpts.maxAge * 1000)
                : cookieOpts?.expires
                ? cookieOpts.expires
                : cookie.expires;

            if (!id) id = await write(data, expires);
            else await update(id, data, expires);

            const commitedCookie = await cookie.commit(id);
            if (commitedCookie.length > MAX_COOKIE_SIZE) {
                throw new Error(
                    "Most modern browsers limit the size of each cookie to 4 KB (4096 bytes); Length=" +
                        commitedCookie.length,
                );
            }
            return commitedCookie;
        },
        destorySession: async (session, options = {}) => {
            if (session?.id) await destory(session.id);
            return await cookie.commit("", {
                ...options,
                maxAge: 0,
                expires: new Date(0),
            });
        },
    };
}

type OnceKey<K extends string> = `__once_key--${K}`;
const onceFn = <K extends string>(key: K): OnceKey<K> => `__once_key--${key}`;

export function createSession<T extends SessionData>(
    cookieValue: T,
    id = "",
): Session<T> {
    const map = new Map(Object.entries(cookieValue)) as Map<
        keyof T | OnceKey<keyof T & string>,
        // deno-lint-ignore no-explicit-any
        any
    >;
    return {
        clean: () => map.clear(),
        delete: (key) => map.delete(key),
        has: (key) => map.has(key) || map.has(onceFn(key)),
        set: (key, value, { once = false } = {}) => map.set(once ? onceFn(key) : key, value),
        get data() {
            return Object.fromEntries(map) as T;
        },
        get id(): string {
            return id;
        },
        get(key) {
            if (map.has(key)) return map.get(key);
            const onceKey = onceFn(key);
            if (map.has(onceKey)) {
                const onceValue = map.get(onceKey);
                map.delete(onceKey);
                return onceValue;
            }
            return void 0;
        },
    };
}

export async function createCookieSessionWithKv<T>(
    entryName: string,
    options: CookieOptions = {},
) {
    const kv = await Deno.openKv(":memory:");
    return createCookieSessionFactory({
        cookies: { name: entryName, options },
        async read(id) {
            const { value } = await kv.get<T>([entryName, id]);
            if (!value) throw new Error("invalid");
            return value;
        },
        async update(id, value, expires) {
            const { ok } = await kv.atomic()
                .set([entryName, id], value, {
                    expireIn: expires?.getMilliseconds(),
                })
                .commit();
            if (!ok) throw new Error("invalid");
        },
        async write(value, expires) {
            const id = crypto.randomUUID();
            const { ok } = await kv.atomic()
                .set([entryName, id], value, {
                    expireIn: expires?.getMilliseconds(),
                })
                .commit();
            if (!ok) throw new Error("invalid");
            return id;
        },
        async destory(id) {
            await kv.delete([entryName, id]);
        },
    });
}
