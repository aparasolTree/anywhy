import { defaultWindow } from "../utils/constant.ts";
import { useBroadcastChannel } from "./useBroadcastChannel.ts";

export function useCrossPageRefresh({ isLogin }: { isLogin: boolean }) {
    const postMessage = useBroadcastChannel<"login_refresh" | "logout_refresh">(
        "page_refresh",
        ({ data }) => {
            if (data === "login_refresh" && defaultWindow && !isLogin) {
                defaultWindow.location.reload();
            } else if (data === "logout_refresh" && defaultWindow && isLogin) {
                defaultWindow.location.reload();
            }
        },
    );

    return postMessage;
}
