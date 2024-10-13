import { getValue, kv, list } from "./index.ts";
import { uuid } from "../cropty.ts";
import { setUserAccess } from "./access.kv.ts";
import {
    ANYWHY_KV_KEY,
    ANYWHY_KV_USER_EMAIL_KEY,
    ANYWHY_KV_USER_ID_KEY,
    ANYWHY_KV_USER_KEY,
    ANYWHY_KV_USER_SESSION_KEY,
    ANYWHY_KV_USER_TOTAL,
    USER_SESSION_EXPIRES,
} from "../constant.ts";
import { badRequest } from "../response.ts";
import { CsvParseStream } from "@std/csv/parse-stream";
import { escape } from "../cookie/escape.ts";
import { unescape } from "../cookie/escape.ts";

export interface User {
    id: string;
    email: string;
    username: string;
    createAt: number;
    role: "admin" | "user";
}

export async function getUserTotal() {
    return Number(
        (await getValue<Deno.KvU64>(
            [ANYWHY_KV_KEY, ANYWHY_KV_USER_KEY, ANYWHY_KV_USER_TOTAL],
        ))?.value || 0,
    );
}

export function createUserEntry(email: string, username: string, role: User["role"] = "user") {
    return {
        id: uuid(),
        email,
        username,
        createAt: Date.now(),
        role,
    };
}

export async function createUser(user: User) {
    const UserIdKey = [ANYWHY_KV_KEY, ANYWHY_KV_USER_KEY, ANYWHY_KV_USER_ID_KEY, user.id];
    const UserEmailKey = [ANYWHY_KV_KEY, ANYWHY_KV_USER_KEY, ANYWHY_KV_USER_EMAIL_KEY, user.email];
    const UserTotalKey = [ANYWHY_KV_KEY, ANYWHY_KV_USER_KEY, ANYWHY_KV_USER_TOTAL];

    const { ok } = await kv.atomic()
        .check({ key: UserIdKey, versionstamp: null })
        .check({ key: UserEmailKey, versionstamp: null })
        .set(UserIdKey, user)
        .set(UserEmailKey, user.id)
        .sum(UserTotalKey, 1n)
        .commit();

    if (!ok) {
        throw new Error("error: the user may already exist");
    }
}

export async function setUserEntryByCSV(readable: ReadableStream<Uint8Array>) {
    const stream = readable
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(
            new CsvParseStream({ skipFirstRow: true, columns: UserEntryKey }),
        );
    for await (const value of stream) {
        const { access, ...entry } = Object.fromEntries(
            Object.entries(value).map(([key, val]) => {
                return [key, JSON.parse(unescape(atob(val)))];
            }),
        );
        await setUserAccess(entry.id, BigInt(access));
        await createUser(entry as User);
    }
}

export async function clearUserKvData() {
    const listIter = kv.list({ prefix: [ANYWHY_KV_KEY, ANYWHY_KV_USER_KEY] });
    let atomic = kv.atomic();
    for await (const { key } of listIter) {
        atomic = atomic.delete(key);
    }
    const { ok } = await atomic.commit();
    if (!ok) {
        throw badRequest("用户数据删除错误，情景快修复bug");
    }
}

const UserEntryKey: (keyof User)[] = [
    "id",
    "username",
    "email",
    "role",
    "createAt",
];
const textEncode = new TextEncoder();
export async function getUserCSV() {
    const total = await getUserTotal() + 1;
    const listIter = kv.list<User>({ prefix: [ANYWHY_KV_KEY, ANYWHY_KV_USER_KEY, ANYWHY_KV_USER_ID_KEY] });
    return {
        total,
        readable: new ReadableStream({
            async start(controller) {
                controller.enqueue(textEncode.encode(`${UserEntryKey.join(",")}\n`));
                for await (const { value } of listIter) {
                    controller.enqueue(
                        textEncode.encode(
                            UserEntryKey.map((key) => {
                                return btoa(escape(JSON.stringify(value[key])));
                            }).join(",") +
                                "\n",
                        ),
                    );
                }
                controller.close();
            },
        }),
    };
}

export async function getUsers(
    { filter = () => true, pipe }: { filter?: (user: User) => boolean; pipe: ((users: User[]) => User[])[] },
) {
    const UserIdKey = [ANYWHY_KV_KEY, ANYWHY_KV_USER_KEY, ANYWHY_KV_USER_ID_KEY];
    const { data, total } = await list<User>(UserIdKey, {
        filter,
        pipe,
    });

    return {
        data,
        total,
    };
}

export async function getUserFromId(id: string) {
    return await getValue<User>([ANYWHY_KV_KEY, ANYWHY_KV_USER_KEY, ANYWHY_KV_USER_ID_KEY, id]);
}

export async function getUserFromEmail(email: string) {
    const id = await getValue<string>([ANYWHY_KV_KEY, ANYWHY_KV_USER_KEY, ANYWHY_KV_USER_EMAIL_KEY, email]);
    if (!id) return null;
    return await getUserFromId(id);
}

export async function emailIsExist(email: string) {
    return !!(await getUserFromEmail(email));
}

export async function createUserSession(userId: string) {
    const sessionId = uuid();
    const userSessionKey = [
        ANYWHY_KV_KEY,
        ANYWHY_KV_USER_KEY,
        ANYWHY_KV_USER_SESSION_KEY,
        sessionId,
    ];

    await kv.atomic()
        .check({ key: userSessionKey, versionstamp: null })
        .set(userSessionKey, userId, { expireIn: USER_SESSION_EXPIRES })
        .commit();

    return sessionId;
}

export async function deleteUserSession(sessionId: string) {
    const userSessionKey = [
        ANYWHY_KV_KEY,
        ANYWHY_KV_USER_KEY,
        ANYWHY_KV_USER_SESSION_KEY,
        sessionId,
    ];

    return await kv.delete(userSessionKey).catch((error) => {
        console.log("Failure deleting user session: ", error);
        return null;
    });
}

export async function getUserFromSessionId(sessionId: string) {
    const userSessionKey = [
        ANYWHY_KV_KEY,
        ANYWHY_KV_USER_KEY,
        ANYWHY_KV_USER_SESSION_KEY,
        sessionId,
    ];

    const userId = await getValue<string>(userSessionKey);
    if (!userId) throw new Error("用户不存在");
    return await getUserFromId(userId);
}
