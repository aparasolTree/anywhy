import { setAccess } from "../utils/kv/access.kv.ts";
import { define, State } from "../utils/define.ts";
import { FreshContext } from "fresh";
import { getUserSession } from "../utils/user.session.ts";

export const handler = define.middleware(async ({ req, state, next }: FreshContext<State>) => {
    const { getUser } = await getUserSession(req);
    const user = await getUser();
    if (user) state.user = user;
    const response = await next();
    if (response.headers.get("Content-Type")?.includes("text/html")) {
        await setAccess();
    }
    return response;
});
