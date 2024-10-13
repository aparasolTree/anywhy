import { createCookieSession } from "./cookie/cookie-session.ts";
import { getEnvVar } from "./common.ts";

const LOGIN_INFO_MAXAGE = 60 * 5;

const loginInfoSession = createCookieSession<
    { error?: string; email?: string; verify_link?: string }
>("ANYWHY_LOGIN_INFO", {
    httpOnly: true,
    path: "/",
    sameSite: "Lax",
    secure: true,
    secret: getEnvVar("SESSION_LOGIN_INFO_SECRET"),
    partitioned: true,
    maxAge: LOGIN_INFO_MAXAGE,
});

export async function getLoginInfoSession(request: Request) {
    const session = await loginInfoSession.getSession(
        request.headers.get("Cookie"),
    );
    const initValue = await loginInfoSession.commitSession(session);

    const commit = async () => {
        const currentValue = await loginInfoSession.commitSession(session);
        return currentValue === initValue ? null : currentValue;
    };

    return {
        session,

        getEmail: () => session.get("email"),
        setEmail: (email: string) => session.set("email", email),

        setVerifyLink: (verifyLink: string) => session.set("verify_link", verifyLink),
        getVerifyLink: () => session.get("verify_link"),

        commit,
        clean: () => session.clean(),
        destory: () => loginInfoSession.destorySession(),

        setError: (error: string) => session.set("error", error, { once: true }),
        getError: () => session.get("error"),

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
