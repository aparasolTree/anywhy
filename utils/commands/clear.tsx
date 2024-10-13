import { useLayoutEffect } from "preact/hooks";
import { parseArgs } from "@std/cli/parse-args";
import { createCommandLineHandler } from "../command.ts";

export const clearCommand = createCommandLineHandler("clear", {
    parse: (args) => parseArgs(args),
});
clearCommand.add(() => ({ clear }) => {
    useLayoutEffect(() => clear(), [clear]);
    return null;
});
