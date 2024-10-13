import { getEnvVar, getErrorMessage } from "./common.ts";
import { createCookieSession } from "./cookie/cookie-session.ts";
import { createUserSession, deleteUserSession, getUserFromSessionId } from "./kv/user.kv.ts";
import { HttpError } from "fresh";

const SESSION_ID_KEY = "__SESSION_ID_KEY__";
const USER_INFO_MAXAGE = 60 * 60 * 24 * 7;
export const userSession = createCookieSession<{ [SESSION_ID_KEY]: string }>(
    "ANTWHY_USER_INFO",
    {
        maxAge: USER_INFO_MAXAGE,
        httpOnly: true,
        partitioned: true,
        path: "/",
        sameSite: "Lax",
        secure: true,
        secret: getEnvVar("SESSION_USER_INFO_SECRET"),
    },
);

export async function getUserSession(request: Request) {
    const session = await userSession.getSession(request.headers.get("Cookie"));
    const initValue = await userSession.commitSession(session);

    const commit = async () => {
        const currentValue = await userSession.commitSession(session);
        return currentValue === initValue ? null : currentValue;
    };
    return {
        session,
        getUser: () => {
            const sessionId = session.get(SESSION_ID_KEY);
            if (!sessionId) return null;
            return getUserFromSessionId(sessionId).catch((error) => {
                session.clean();
                console.error(`Failure getting user from session ID:`, getErrorMessage(error));
                return null;
            });
        },

        commit,
        clean: () => session.clean(),
        destory: () => userSession.destorySession(),

        signIn: async (id: string) => session.set(SESSION_ID_KEY, await createUserSession(id)),
        signOut: async () => {
            const sessionId = session.get(SESSION_ID_KEY);
            if (sessionId) {
                session.clean();
                await deleteUserSession(sessionId);
            }
        },

        getHeaders: async (
            headers: ResponseInit["headers"] = new Headers(),
        ) => {
            const value = await commit();
            if (!value) return headers;
            if (headers instanceof Headers) headers.append("Set-Cookie", value);
            else if (Array.isArray(headers)) {
                headers.push(["Set-Cookie", value]);
            } else headers["Set-Cookie"] = value;
            return headers;
        },
    };
}

export async function requiredAdmin(request: Request) {
    const { getUser } = await getUserSession(request);
    const user = await getUser();
    if (user?.role !== "admin") {
        throw new HttpError(404);
    }
}
