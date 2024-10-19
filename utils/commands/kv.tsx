import { useRef } from "preact/hooks";
import { parseArgs } from "@std/cli/parse-args";
import { createCommandLineHandler } from "../command.ts";
import { CommandRecord } from "../../islands/CommandRecord.tsx";
import { RequestConfirm } from "../../islands/RequestConfirm.tsx";
import { usePromise } from "../../hooks/usePromise.ts";
import { fetcher } from "../fetcher.ts";
import { Case, Switch } from "../../islands/Switch.tsx";
import { CommandLineError } from "../../components/CommandLineError.tsx";
import { CommandLineLoading } from "../../components/CommandLineLoading.tsx";
import { allowClearCommands } from "../common.ts";
import { useDownload } from "../../hooks/useDownload.ts";
import { JSX } from "preact";
import { useSetState } from "../../hooks/useSetState.ts";
import { useMountedClick } from "../../hooks/useMountedClick.ts";

export const kvCommand = createCommandLineHandler("kv", {
    conflictRecord: { clear: ["upload", "download"], upload: ["download"] },
    parse: (args) => parseArgs(args, { string: ["clear", "upload", "download"] }),
});

// kv --clear <user | image>
kvCommand.add(({ clear }) => {
    if (typeof clear === "undefined") return null;
    if (!clear) clear = "all";
    const allowClear = allowClearCommands.includes(clear);
    return ({ command }) => {
        return (
            <CommandRecord command={command}>
                {allowClear
                    ? (
                        <RequestConfirm
                            title={`确定要清除kv中的${clear}数据？`}
                            no={<div>清除取消</div>}
                            yes={<KvClear clear={clear} />}
                        />
                    )
                    : <CommandLineError errorMessage={`${clear} 数据不存在`} />}
            </CommandRecord>
        );
    };
});

async function fetchKvClear(clear: string) {
    const formData = new FormData();
    formData.append("clear", clear);
    return await fetcher("/admin/api/kv", {
        method: "POST",
        body: formData,
    });
}

export function KvClear({ clear }: { clear: string }) {
    const { data, status, msg } = usePromise(() => fetchKvClear(clear), [clear]);
    return (
        <Switch when={status}>
            <Case value="error" content={<CommandLineError errorMessage={msg} />} />
            <Case value="loading" content={<CommandLineLoading />} />
            <Case value="idle" content={data ? <div>删除成功</div> : null} />
        </Switch>
    );
}

// kv --download <image | user>
kvCommand.add(({ download }) => {
    if (!download) return null;
    const allowDownload = ["image", "user"].includes(download);
    return ({ command }) => {
        return (
            <CommandRecord command={command}>
                {allowDownload ? <DownloadCSV csv={download} /> : <CommandLineError errorMessage={`${download} 无法识别`} />}
            </CommandRecord>
        );
    };
});

function DownloadCSV({ csv }: { csv: string }) {
    const aRef = useRef<HTMLAnchorElement>(null);
    const [{ loaded, total }] = useDownload(`/admin/api/csv?csv=${csv}`, {
        onDone: (buffer) => {
            const a = aRef.current;
            if (a) {
                a.download = csv + ".csv";
                a.href = URL.createObjectURL(new Blob([buffer], { type: "text/csv" }));
                a.click();
                URL.revokeObjectURL(a.href);
                a.href = "";
            }
        },
    });
    const done = loaded === total;
    return (
        <div>
            <div class="px-2 flex gap-2 items-center">
                <div class="w-12">{Math.round(loaded / total * 100)}%</div>
                <div class="flex-1">
                    <div
                        class="h-1 rounded-full overflow-hidden bg-green-500"
                        style={{
                            width: `${Math.round(loaded / total * 100)}%`,
                            transition: "width 50ms ease-in-out",
                        }}
                    />
                </div>
            </div>
            <a ref={aRef} href="" class="hidden" />
            {done && <div class="text-green-500 mt-3">下载完成 (～￣▽￣)～</div>}
        </div>
    );
}

// kv --upload <image | user>
kvCommand.add(({ upload }) => {
    if (!upload) return null;
    const allowUplaod = ["user", "image"].includes(upload);
    type UploadState = { file: File | null; allow: boolean };
    return ({ command }) => {
        const ref = useMountedClick<HTMLInputElement>();
        const [state, setState] = useSetState<UploadState>({ file: null, allow: true });
        const onChange: JSX.InputEventHandler<HTMLInputElement> = ({ currentTarget }) => {
            const file = currentTarget.files!.item(0)!;
            const extname = file.name.split(".").pop();
            if (extname === "csv") return setState({ file, allow: true });
            setState({ allow: false });
        };

        return (
            <CommandRecord command={command}>
                {!state.file && allowUplaod ? <input accept=".csv" type="file" class="hidden" onChange={onChange} ref={ref} /> : null}
                {state.file
                    ? (
                        <KVCSVDataUpload
                            type={upload as "image" | "user"}
                            file={state.file}
                        />
                    )
                    : state.allow
                    ? !allowUplaod ? <CommandLineError errorMessage={`${upload}类型不支持`} /> : null
                    : <CommandLineError errorMessage="文件扩展名不支持" />}
            </CommandRecord>
        );
    };
});

async function uploadCSVData(file: File, type: "user" | "image") {
    const formData = new FormData();
    formData.append("csv", file);
    formData.append("type", type);
    return await fetcher("/admin/api/csv", {
        method: "POST",
        body: formData,
    });
}

function KVCSVDataUpload({ file, type }: { file: File; type: "image" | "user" }) {
    const { data, status, msg } = usePromise(() => uploadCSVData(file, type), [file, type]);
    return (
        <div>
            <Switch when={status}>
                <Case value="error" content={<CommandLineError errorMessage={msg} />} />
                <Case value="loading" content={<CommandLineLoading />} />
                <Case value="idle" content={data ? <div class="text-green-400">上传成功 (～￣▽￣)～</div> : null} />
            </Switch>
        </div>
    );
}
