import { extname } from "@std/path";
import { useMemoizeFn } from "./useMemoizeFn.ts";
import { useSetState } from "./useSetState.ts";
import { bytesConversion } from "../utils/common.ts";

interface Options {
    maxSize?: number;
    accept?: string[];
    maxFiles?: number;
}

export function useFilePicker({ accept = [], maxFiles = 6, maxSize = 1024 * 1024 }: Options = {}) {
    const [state, setState] = useSetState<{ files: File[]; error: string }>({ files: [], error: "" });
    const remove = useMemoizeFn((name?: string) =>
        setState(({ files, ...other }) => {
            return {
                ...other,
                files: typeof name === "undefined" ? [] : files.filter((file) => file.name !== name),
            };
        })
    );
    const onInput = useMemoizeFn((files: FileList) => {
        const arrayFiles = Array.from(files);
        if (arrayFiles.length > maxFiles) return setState({ error: "当前上传的文件数量超过最大值：" + maxFiles });
        if (arrayFiles.some((file) => file.size > maxSize)) return setState({ error: "上传的单个文件大小不能超过：" + bytesConversion(maxSize) });
        const notAllowedFile = arrayFiles.find((file) => !accept.includes(extname(file.name)));
        if (notAllowedFile) return setState({ error: "文件扩展名不支持：" + extname(notAllowedFile.name) });
        setState({ files: arrayFiles });
    });

    return [
        state,
        { remove, onInput },
    ] as const;
}
