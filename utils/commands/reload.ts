import { useLayoutEffect } from "preact/hooks";
import { createCommandLineHandler } from "../command.ts";

export const reloadCommand = createCommandLineHandler("reload");
reloadCommand.add(() => () => {
    useLayoutEffect(() => {
        location.reload();
    }, []);
    return null;
});
