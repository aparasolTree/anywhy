import { parseArgs } from "@std/cli/parse-args";
import { CommandRecord } from "../../islands/CommandRecord.tsx";
import { createCommandLineHandler } from "../command.ts";

export const gotoCommand = createCommandLineHandler("goto", {
    parse: (args) =>
        parseArgs(args, {
            string: ["path"],
            alias: { path: "p" },
            unknown: (_, key) => {
                console.log(_);
                throw new Error(`image命令 无法解析 ${key} 参数。`);
            },
        }),
});

gotoCommand.add(({ path }) => {
    if (!path) throw new Error("path 参数不能为空。");
    if (path === "image") location.href = "/image";
    else if (path === "blog") location.href = "/blog";
    else if (path === "home") location.href = "/";
    else {
        const canParse = URL.canParse(path);
        canParse && globalThis.open(path);
        return ({ command }) => (
            <CommandRecord command={command}>
                {canParse ? <span>打开页面成功</span> : <span>不正确路径 {path}</span>}
            </CommandRecord>
        );
    }
    return () => null;
});
