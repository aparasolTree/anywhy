import { memo } from "preact/compat";
import { createElement, JSX } from "preact";
import { Dispatch, StateUpdater, useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks";
import { useShortcutKey } from "../hooks/useShortcutKey.ts";
import { useToggleState } from "../hooks/useToggle.ts";
import { Modal } from "./Modal.tsx";
import { isFunction } from "../utils/common.ts";
import { checkImageEvent } from "../utils/commandLineEvent.ts";
import { useScrollToLastElementChild } from "../hooks/useScrollToLastElementChild.ts";
import { useInputFocus } from "../hooks/useInputFocus.ts";
import { imageCommand } from "../utils/commands/image.tsx";
import { accessCommand } from "../utils/commands/access.tsx";
import { uploadCommand } from "../utils/commands/upload.tsx";
import { gotoCommand } from "../utils/commands/goto.tsx";
import { clearCommand } from "../utils/commands/clear.tsx";
import { BodyProps } from "../utils/command.ts";
import { reloadCommand } from "../utils/commands/reload.ts";
import { blogCommand } from "../utils/commands/blog.tsx";
import { kvCommand } from "../utils/commands/kv.tsx";
import { useSetState } from "../hooks/useSetState.ts";
import { CommandCacheLUR } from "../utils/CommandCacheLUR.ts";
import { userCommand } from "../utils/commands/user.tsx";
import { toast } from "../utils/toast/index.ts";

export function CommandLine() {
    const [show, { toggle }] = useToggleState();
    const reset = useCallback(() => toggle(false), []);
    useShortcutKey("p", () => toggle(), { modifier: "ctrl", eventName: "keydown" });
    return (
        <Modal direction="top" show={show} onClose={reset} class="mt-20 w-[75vw]">
            <ImageView />
            <CommandLineInput />
        </Modal>
    );
}

function ImageView() {
    const [imageName, setImageName] = useState("");
    useEffect(() => {
        return checkImageEvent.add((name) => setImageName(name));
    }, []);
    return (
        <img
            src={`/image/${imageName}`}
            alt=""
            class={[
                imageName ? "block" : "hidden",
                "w-[200px] rounded-md fixed right-4 top-4 z-[9999]",
            ].join(" ")}
        />
    );
}

function isCursorAtEnd(element: HTMLInputElement) {
    const currentCursorPosition = element.selectionStart;
    return element.value.length === currentCursorPosition;
}

function cursorToEnd(element: HTMLInputElement) {
    requestAnimationFrame(() => {
        const valueLength = element.value.length;
        element.focus();
        element.setSelectionRange(valueLength, valueLength);
    });
}

const commandLineCommands = {
    image: imageCommand,
    access: accessCommand,
    upload: uploadCommand,
    goto: gotoCommand,
    clear: clearCommand,
    reload: reloadCommand,
    blog: blogCommand,
    kv: kvCommand,
    user: userCommand,
};
type CommandLineCommandsKey = keyof typeof commandLineCommands;
type CommandLineState = { value: string; matchCommand: string };
function CommandLineInput() {
    const inputRef = useInputFocus();
    useShortcutKey("f", () => inputRef.current?.focus(), { modifier: "ctrl", eventName: "keydown" });
    const [{ matchCommand, value }, setCommandLineState] = useSetState<CommandLineState>({
        value: "",
        matchCommand: "",
    });
    const [commandRecord, setCommandRecord] = useCommandRecord();
    const { add, forwards, reset, rollback, get } = useCommandHistory();
    const input: JSX.InputEventHandler<HTMLInputElement> = (event) => {
        reset();
        const value = event.currentTarget.value;
        setCommandLineState({ value });
        if (value === "") return setCommandLineState({ matchCommand: "" });
        const matchCommand = get(value);
        if (matchCommand) {
            return setCommandLineState({ matchCommand });
        }
        setCommandLineState({ matchCommand: "" });
    };
    const keydown: JSX.KeyboardEventHandler<HTMLInputElement> = (event) => {
        const target = event.currentTarget;
        if (event.key === "ArrowRight" && isCursorAtEnd(target) && matchCommand) {
            setCommandLineState({ value: matchCommand });
        } else if (event.key === "ArrowUp") setCommandLineState({ value: rollback() }), cursorToEnd(target);
        else if (event.key === "ArrowDown") setCommandLineState({ value: forwards() }), cursorToEnd(target);
        else if (event.key === "Enter") {
            const args = value.trim().split(" ");
            const command = args[0] as CommandLineCommandsKey;
            if (!Object.keys(commandLineCommands).includes(command)) return toast.error(`${command} 无法解析此命令`);
            const body = commandLineCommands[command].run(args.slice(1));
            setCommandLineState({ value: "", matchCommand: "" });
            if (body) {
                setCommandRecord((prev) => [...prev, { body: memo(body), command: value }]);
                add(value);
                reset();
            }
        }
    };

    const divRef = useScrollToLastElementChild<HTMLDivElement>();
    const clear = useCallback(() => setCommandRecord([]), []);
    useShortcutKey("l", clear, { modifier: "ctrl", eventName: "keydown" });
    return (
        <div class="w-full">
            <div class="flex items-center bg-white rounded-xl pl-3">
                <div class={["flex-1 relative p-3 transition-all"].join(" ")}>
                    <div class="text-gray-300 leading-5 h-5">{matchCommand}</div>
                    <input
                        autoFocus
                        type="text"
                        value={value}
                        ref={inputRef}
                        onInput={input}
                        onKeyDown={keydown}
                        class="focus:outline-none leading-5 absolute top-0 left-0 bottom-0 right-0 p-3 bg-transparent"
                    />
                </div>
            </div>
            <div
                ref={divRef}
                style={{
                    backgroundImage: "radial-gradient(#f1f5f8 20%, transparent 0)",
                    backgroundSize: "16px 16px",
                }}
                class="mt-4 rounded-lg bg-white h-[65vh] overflow-auto p-5 flex flex-col items-start gap-6"
            >
                {commandRecord.length
                    ? commandRecord.map(({ command, body }, i) =>
                        createElement(body, {
                            key: i,
                            clear,
                            command,
                        })
                    )
                    : <CommandsTip />}
            </div>
        </div>
    );
}
const commandTip = {
    clear: ["clear / ctrl+l"],
    goto: ["goto -p/--path <string | home | image | blog>"],
    reload: ["reload"],
    upload: ["upload"],
    access: ["access [--year <string>]"],
    blog: ["blog --list"],
    user: ["user --list [-p/--page <number>] [-l/--limit <number>]"],
    kv: ["kv --clear <all | image | user>", "kv --download --csv <image | user>", "kv --upload <image | user>"],
    image: [
        "image --cache [--reload]",
        "image --remove --id <string>",
        "image --list [-f/--filter <string>] [-p/--page <number>] [-l/--limit <number>] [-o/--order <string>] [-s/--sort <string>] [-k/--pick <string>] [--reload]",
    ],
};
function CommandsTip() {
    return (
        <div class="w-full h-full text-gray-400 flex flex-col items-center justify-center">
            <p class="text-center text-2xl">现阶段支持的命令</p>
            <ul class="pl-4">
                {Object.values(commandTip).map((subcommands) => (
                    subcommands.map((sub) => <li class="text-center">{sub}</li>)
                ))}
            </ul>
        </div>
    );
}

function escapeRegExp(str: string) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function useCommandHistory(maxSize: number = 30) {
    const ref = useRef<{ lur: CommandCacheLUR | null; index: number }>({ index: 0, lur: null });
    useEffect(() => {
        const localStorage = globalThis.localStorage;
        const commandHistory = JSON.parse(localStorage.getItem("command_history") || "[]");
        const lur = new CommandCacheLUR(commandHistory, { maxSize });
        ref.current.lur = lur;
        ref.current.index = lur.size;
    }, []);

    return useMemo(() => {
        const reset = () => ref.current.index = ref.current.lur?.size || 0;
        const rollback = () => {
            const lur = ref.current.lur;
            if (lur) {
                ref.current.index = Math.max(--ref.current.index, 0);
                return lur.valueOf()[ref.current.index];
            }
        };
        const forwards = () => {
            const lur = ref.current.lur;
            if (lur) {
                ref.current.index = Math.min(++ref.current.index, lur.size);
                return lur.valueOf()[ref.current.index] || "";
            }
        };

        return {
            reset,
            rollback,
            forwards,
            get: (val: string) => ref.current.lur?.get(new RegExp(`^${escapeRegExp(val)}`, "g")),
            add: (val: string) => {
                ref.current.lur?.add(val);
                const stringifyCommands = JSON.stringify(ref.current.lur?.valueOf() || "[]");
                localStorage.setItem("command_history", stringifyCommands);
            },
        };
    }, []);
}

function useCommandRecord(maxSize: number = 20) {
    type CommandInfo = { body: (props: BodyProps) => JSX.Element | null; command: string };
    const [commandRecord, setCommandRecord] = useState<CommandInfo[]>([]);
    return [
        commandRecord,
        useCallback<Dispatch<StateUpdater<CommandInfo[]>>>((state) => {
            setCommandRecord((prevState) => {
                const newState = isFunction(state) ? state(prevState) : state;
                return newState.length > maxSize ? newState.slice(-maxSize) : newState;
            });
        }, [maxSize]),
    ] as const;
}
