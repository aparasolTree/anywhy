import { useLayoutEffect } from "preact/hooks";
import { parseArgs } from "@std/cli/parse-args";
import { createCommandLineHandler } from "../command.ts";
import { CommandRecord } from "../../components/CommandRecord.tsx";
import { togglePanelEvent } from "../commandLineEvent.ts";

export const uploadCommand = createCommandLineHandler("upload", {
    parse: (args) =>
        parseArgs(args, {
            unknown: (_, key) => {
                console.log(_);
                throw new Error(`image命令 无法解析 ${key} 参数。`);
            },
        }),
});

uploadCommand.add(() => {
    return ({ command }) => {
        useLayoutEffect(() => togglePanelEvent.dispatch("upload"), []);
        return (
            <CommandRecord command={command}>
                <p>上传面板打开成功。</p>
            </CommandRecord>
        );
    };
});
