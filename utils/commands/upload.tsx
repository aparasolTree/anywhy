import { useMemo } from "preact/hooks";
import { parseArgs } from "@std/cli/parse-args";
import { createCommandLineHandler } from "../command.ts";
import { CommandRecord } from "../../islands/CommandRecord.tsx";
import { useFilePicker } from "../../hooks/useFilePicker.ts";
import { CommandLineError } from "../../components/CommandLineError.tsx";
import { Table, TableColumn } from "../../islands/Table.tsx";
import { bytesConversion } from "../common.ts";
import { useMountedClick } from "../../hooks/useMountedClick.ts";
import { RequestConfirm } from "../../islands/RequestConfirm.tsx";
import { usePromise } from "../../hooks/usePromise.ts";
import { fetcher } from "../fetcher.ts";
import { Case, Switch } from "../../islands/Switch.tsx";
import { CommandLineLoading } from "../../components/CommandLineLoading.tsx";

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
        const [{ error, files }, { onInput, remove }] = useFilePicker({ accept: [".jpg", ".jpeg"] });
        const showFilesInfo = useMemo(() => files.map(({ name, size, type }) => ({ name, size, type })), [files]);
        const inputRef = useMountedClick<HTMLInputElement>();
        const fileOnInput = ({ currentTarget }: InputEvent) => {
            const fileList = (currentTarget as HTMLInputElement).files;
            if (fileList?.length) {
                onInput(fileList);
            }
        };
        return (
            <CommandRecord command={command}>
                <input ref={inputRef} type="file" class="hidden" multiple accept=".jpg,.jpeg" onInput={fileOnInput} />
                {error ? <CommandLineError errorMessage={error} /> : files.length
                    ? (
                        <div class="flex flex-col gap-4 items-start">
                            <Table data={showFilesInfo}>
                                <TableColumn dataKey="name" title="文件名" />
                                <TableColumn dataKey="size" title="文件大小" render={(size: number) => bytesConversion(size)} />
                                <TableColumn dataKey="type" title="文件类型" />
                                <TableColumn
                                    dataKey="action"
                                    title="操作"
                                    render={({ name }: { name: string }) => (
                                        <button
                                            class="my-4 text-red-500 text-sm"
                                            onClick={() => remove(name)}
                                        >
                                            删除文件
                                        </button>
                                    )}
                                />
                            </Table>
                            <RequestConfirm
                                no={<div>用户取消上传</div>}
                                yes={<UploadFile files={files} />}
                                title="(╹ڡ╹ ) 是否上传当前选择的文件？"
                            />
                        </div>
                    )
                    : null}
            </CommandRecord>
        );
    };
});

function uploadFiles(files: File[]) {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));
    return fetcher("/admin/upload", {
        method: "POST",
        body: formData,
    });
}
function UploadFile({ files }: { files: File[] }) {
    const { data, status, msg } = usePromise(() => uploadFiles(files), [files]);
    return (
        <Switch when={status}>
            <Case value="loading" content={<CommandLineLoading tip="文件上传中..." />} />
            <Case value="error" content={<CommandLineError errorMessage={msg} />} />
            <Case value="idle" content={data ? <div>上传成功</div> : null} />
        </Switch>
    );
}
