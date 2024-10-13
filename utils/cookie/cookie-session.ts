import { CookieOptions, createCookie } from "./cookie.ts";
import { CookieSession, createSession, SessionData } from "./session.ts";

const MAX_COOKIE_SIZE = 4096;
export function createCookieSession<T extends SessionData>(
    name: string,
    options: CookieOptions = {},
): CookieSession<T> {
    const cookie = createCookie<T>(name, options);
    return {
        getSession: async (cookieHeader) => {
            return createSession<T>(
                await cookie.parse(cookieHeader) || {} as T,
            );
        },
        commitSession: async (session) => {
            const commitedCookie = await cookie.commit(session.data);
            if (commitedCookie.length > MAX_COOKIE_SIZE) {
                throw new Error(
                    "Most modern browsers limit the size of each cookie to 4 KB (4096 bytes); Length=" +
                        commitedCookie.length,
                );
            }
            return commitedCookie;
        },
        destorySession: async (options) => {
            return await cookie.commit(void 0, {
                ...options,
                expires: new Date(0),
                maxAge: 0,
            });
        },
    };
}
