import { ComponentChild } from "preact";
import { formatDate } from "../utils/formatDate.ts";

export function CommandRecord({ command, children }: { command: string; children?: ComponentChild }) {
    return (
        <div class="w-full relative">
            <p class="text-base text-start mb-2 flex justify-between py-1">
                <span>
                    <span class="text-lg mr-3 text-sky-500">{"$_>"}</span>
                    <span class="text-green-500">{command}</span>
                </span>
                <span class="text-sm text-gray-500">{formatDate(new Date(), "HH:mm:ss")}</span>
            </p>
            <div class="mt-2">
                {children}
            </div>
        </div>
    );
}
