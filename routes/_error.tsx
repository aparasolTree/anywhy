import { HttpError } from "fresh";
import { asset } from "fresh/runtime";
import { define } from "../utils/define.ts";
import { getErrorMessage } from "../utils/common.ts";

export function ServerCodeError({ src, desc }: { src: string; desc: string }) {
    return (
        <div class="w-screen h-screen flex justify-center items-center">
            <div class="w-[60vw] h-[65vh] rounded-md bg-white shadow-md flex flex-col justify-center items-center gap-4 p-4">
                <img src={asset(src)} alt="页面没有找到" class="w-[400px]" />
                <p class="text-2xl">{desc}</p>
                <a href="/" class="hover:underline">返回首页</a>
            </div>
        </div>
    );
}

export default define.page(function ErrorRoute({ error }) {
    if (error instanceof HttpError) {
        if (error.status === 404) {
            return (
                <ServerCodeError
                    src="/svg/page_not_found.svg"
                    desc="(っ °Д °;)っ 糟糕，当前页面没有找到"
                />
            );
        }
    }
    return (
        <ServerCodeError
            src="/svg/server_down.svg"
            desc={"(╯▔皿▔)╯ 哎呀！出了点问题。" + getErrorMessage(error)}
        />
    );
});
