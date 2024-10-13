import { JSX } from "preact";
import { getErrorMessage, isFunction } from "./common.ts";
import { AnyFuncion } from "./type.ts";
import { toast } from "./toast/index.ts";

function validateArgsConflict<T extends Record<string, unknown>>(args: T, conflictRecord: Record<string, string[]>) {
    for (const [param, conflicts] of Object.entries(conflictRecord)) {
        if (args[param] !== undefined && args[param] !== false) {
            if (Array.isArray(args[param]) && !args[param].length) continue;
            const conflictIndex = conflicts.findIndex((conflict) => !!args[conflict]);
            if (conflictIndex > -1) {
                throw new Error(`选项 --${conflicts[conflictIndex]} 和 --${param} 不能同时使用。`);
            }
        }
    }
}
export type BodyProps = { command: string; clear: AnyFuncion };
export function createCommandLineHandler<T extends Record<string, unknown>>(
    command: string,
    { conflictRecord, parse }: {
        conflictRecord?: Record<string, string[]>;
        parse?: (args: string[]) => T;
    } = {},
) {
    type Handler = (args: T) => ((props: BodyProps) => JSX.Element | null) | null;
    const handlers: Handler[] = [];
    return {
        command,
        add: (...args: Handler[]) => handlers.push(...args),
        run: (args: string[]): ReturnType<Handler> => {
            try {
                const parsedArgs = isFunction(parse) ? parse(args) : {} as T;
                validateArgsConflict(parsedArgs, conflictRecord || {});
                for (const handler of handlers) {
                    const comp = handler(parsedArgs);
                    if (comp) {
                        return comp;
                    }
                }
                throw new Error("当前命令无法解析传递的参数。");
            } catch (error) {
                console.log(error);
                toast.error(getErrorMessage(error), { position: "top left" });
                return null;
            }
        },
    };
}
