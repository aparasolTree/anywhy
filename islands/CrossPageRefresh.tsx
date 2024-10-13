import { useEffect } from "preact/hooks";
import { useCrossPageRefresh } from "../hooks/useCrossPageRefresh.ts";

export interface CrossPageRefreshPrps {
    isLogin: boolean;
}
export function CrossPageRefresh({ isLogin }: CrossPageRefreshPrps) {
    const postMessage = useCrossPageRefresh({ isLogin });
    useEffect(() => {
        isLogin ? postMessage("login_refresh") : postMessage("logout_refresh");
    }, [isLogin, postMessage]);
    return null;
}
