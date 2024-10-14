import { Define, FreshContext } from "fresh";
import { User } from "./kv/user.kv.ts";
import { isObject } from "./common.ts";

export interface State {
    user: User;
    title: string;
    description: string;
    noIndex: boolean;
}

export const define: Define<State> = {
    handlers(handlers) {
        const newHandlers = isObject(handlers) ? handlers : { GET: handlers };
        return Object.fromEntries(
            Object.entries(newHandlers).map(([method, handler]) => {
                return [method, async function (ctx: FreshContext<State>) {
                    try {
                        return await handler(ctx);
                    } catch (error) {
                        if (error instanceof Response) return error;
                        throw error;
                    }
                }];
            }),
        ) as typeof handlers;
    },
    page(render) {
        return render;
    },
    middleware(middleware) {
        return middleware;
    },
};
