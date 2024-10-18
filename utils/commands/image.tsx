import { ComponentChild } from "preact";
import { parseArgs } from "@std/cli/parse-args";
import { createCommandLineHandler } from "../command.ts";
import { fetcher } from "../fetcher.ts";
import { usePromise } from "../../hooks/usePromise.ts";
import { Case, Switch } from "../../islands/Switch.tsx";
import { Table, TableColumn } from "../../islands/Table.tsx";
import { bytesConversion, createFetcherURL, filterCommandArgsReg, pick, removeQuoteReg } from "../common.ts";
import { CommandLineError } from "../../components/CommandLineError.tsx";
import { formatDate } from "../formatDate.ts";
import { ImageEntry } from "../type.ts";
import { toast } from "../toast/index.ts";
import { CommandLineLoading } from "../../components/CommandLineLoading.tsx";
import { CommandRecord } from "../../components/CommandRecord.tsx";
import { CopyButton } from "../../islands/CopyButton.tsx";
import { CommandLineImageCheck } from "../../islands/CommandLineImageCheck.tsx";
import { RequestConfirm } from "../../islands/RequestConfirm.tsx";

export const imageCommand = createCommandLineHandler("image", {
    conflictRecord: {
        remove: ["help", "cache", "reload", "space"],
        list: ["remove", "help", "cache", "space"],
        cache: ["help"],

        space: ["reload"],
        page: ["remove", "help", "cache", "space"],
        limit: ["remove", "help", "cache", "space"],
        pick: ["remove", "help", "cache", "space"],
        order: ["remove", "help", "cache", "space"],
        sort: ["remove", "help", "cache", "space"],
        filter: ["remove", "help", "cache", "space"],
        id: ["help", "list", "cache", "page", "limit", "pick", "order", "sort", "reload", "filter", "space"],
    },
    parse: (args) =>
        parseArgs(args, {
            string: ["id", "page", "limit", "pick", "order", "sort", "filter", "space"],
            boolean: ["remove", "help", "list", "cache", "reload"],
            alias: {
                pick: "k",
                order: "o",
                sort: "s",
                filter: "f",
                limit: "l",
                page: "p",
            },
            unknown: (_, key) => {
                console.log(_);
                throw new Error(`image命令 无法解析 ${key} 参数。`);
            },
        }),
});

// cache
const fetchImageCacheData = async (reload: boolean) => {
    const data = await fetcher<{ total: number; size: number; space: number }>("/admin/api/image/cache", { reload });
    return data;
};

imageCommand.add(({ cache, space, reload = false }) => {
    if (!cache || space) return null;
    const imageCacheData = fetchImageCacheData(reload);
    return ({ command }) => {
        const { data, status, msg } = usePromise(imageCacheData, []);
        return (
            <CommandRecord command={command}>
                <Switch when={status} keepAlive={false} animation={false}>
                    <Case value="loading" content={<CommandLineLoading />} />
                    <Case value="error" content={<CommandLineError errorMessage={msg} />} />
                    <Case
                        value="idle"
                        content={data && (
                            <Table data={[data]}>
                                <TableColumn dataKey="total" title="缓存总数" />
                                <TableColumn dataKey="size" title="已使用空间" render={(val) => `${bytesConversion(val)}`} />
                                <TableColumn dataKey="space" title="总空间" render={(val) => `${bytesConversion(val)}`} />
                            </Table>
                        )}
                    />
                </Switch>
            </CommandRecord>
        );
    };
});

function setImageDataCachedSpace(space: string) {
    const formData = new FormData();
    formData.append("space", String(space));
    return fetcher("/admin/api/image/cache", {
        method: "POST",
        body: formData,
    });
}

const cacheSpaceReg = /^((-|\+)(\d+))$/;
imageCommand.add(({ cache, space }) => {
    if (!cache || !space) return null;
    console.log(space.replaceAll(removeQuoteReg, ""));
    const formattedSpace = space.replaceAll(removeQuoteReg, "$2");
    const pattern = cacheSpaceReg.test(formattedSpace);
    return ({ command }) => {
        return (
            <CommandRecord command={command}>
                {pattern ? <SetCacheSpace space={formattedSpace} /> : (
                    <div>
                        <span class="text-red-500">{formattedSpace}</span> ：格式错误
                    </div>
                )}
            </CommandRecord>
        );
    };
});

function SetCacheSpace({ space }: { space: string }) {
    const { data, status, msg } = usePromise(() => setImageDataCachedSpace(space), [space]);
    return (
        <Switch when={status}>
            <Case value="error" content={<CommandLineError errorMessage={msg} />} />
            <Case value="loading" content={<CommandLineLoading tip="正在修改图片数据缓存空间" />} />
            <Case value="idle" content={data ? <div>修改成功</div> : null} />
        </Switch>
    );
}

// remove image
function requestRemoveImage(id: string) {
    const formData = new FormData();
    formData.append("id", id);
    formData.append("action", "delete");
    return fetcher("/admin/image", { method: "POST", body: formData });
}

function RemoveImage({ id }: { id: string }) {
    const { data, status, msg } = usePromise(() => requestRemoveImage(id), []);
    return (
        <Switch when={status}>
            <Case value="loading" content={<CommandLineLoading tip="正在请求删除,请稍后..." />} />
            <Case value="error" content={<CommandLineError errorMessage={msg} />} />
            <Case value="idle" content={data ? <div>删除成功</div> : null} />
        </Switch>
    );
}

imageCommand.add(({ remove, id }) => {
    if (!remove) return null;
    return ({ command }) => {
        return (
            <CommandRecord command={command}>
                {id
                    ? (
                        <RequestConfirm
                            title="你确定要删除图片？"
                            yes={<RemoveImage id={id} />}
                            no={<div>删除取消</div>}
                        />
                    )
                    : <span class="text-red-500">参数--id不能为空</span>}
            </CommandRecord>
        );
    };
});

// image --list
const entryKeyMap: Record<keyof ImageEntry, string> = {
    id: "id",
    name: "图片名",
    exif: "图片元信息",
    createAt: "创建时间",
    downloads: "下载次数",
    views: "浏览次数",
    height: "高度",
    width: "宽度",
    size: "图片大小",
};

const render: Partial<Record<keyof ImageEntry, (val: ImageEntry[keyof ImageEntry]) => ComponentChild>> = {
    createAt: (val) => formatDate(new Date(val as number), "YYYY/MM/DD"),
    exif: (val) => JSON.stringify(val as object),
    size: (val) => bytesConversion(val as number),
    id: (val) => <CopyButton className="hover:underline text-red-500" content={val as string} text={val as string} />,
    name: (val) => <CommandLineImageCheck name={val as string} />,
};

function fetchImageData(
    props: {
        sort: string;
        limit: string;
        page: string;
        order: string;
        reload: boolean;
        filter?: string;
    },
) {
    const { reload } = props;
    type FetchData = { imageEntries: ImageEntry[]; page: number; limit: number; done: boolean; total: number };
    const pickSearchParams = pick(props, ["limit", "order", "page", "sort", "filter"]);
    return fetcher<FetchData>(
        createFetcherURL("/admin/api/image", pickSearchParams),
        {
            reload,
            headers: {
                "Content-Type": "application/json",
            },
        },
    );
}

imageCommand.add((args) => {
    const { list, filter, limit = "1", page = "1", pick = "", sort = "", order = "", reload = false } = args;
    if (!list) return null;
    if (filter) {
        const filters = filter.replaceAll(removeQuoteReg, "$2").split("&").filter(Boolean);
        if (filters.length && !filters.every((f) => filterCommandArgsReg.exec(f))) {
            toast.error(`filter 参数格式错误。`);
            return null;
        }
    }
    const fetchArgs = { limit, order, page, sort, reload, filter };
    const imageData = fetchImageData(fetchArgs);
    return ({ command }) => {
        const { data, status, msg } = usePromise(imageData, []);
        let keys = pick.split(",").filter(Boolean) as (keyof ImageEntry)[];
        if (keys.length === 0) keys = Object.keys(entryKeyMap) as (keyof ImageEntry)[];
        return (
            <CommandRecord command={command}>
                <Switch when={status} keepAlive={false} animation={false}>
                    <Case value="loading" content={<CommandLineLoading />} />
                    <Case value="error" content={<CommandLineError errorMessage={msg} />} />
                    <Case
                        value="idle"
                        content={data &&
                            (!data.imageEntries?.length ? <p>查询数据为空</p> : (
                                <>
                                    <div class="mb-4">
                                        查询到的数据共{data.total}条 共{Math.ceil(data.total / Number(limit))}页 当前第{data.page}页{" "}
                                        {data.imageEntries.length}条
                                    </div>
                                    <Table data={data.imageEntries}>
                                        {keys.map((key) => {
                                            return (
                                                <TableColumn
                                                    dataKey={key}
                                                    title={entryKeyMap[key]}
                                                    render={render[key]}
                                                />
                                            );
                                        })}
                                    </Table>
                                </>
                            ))}
                    />
                </Switch>
            </CommandRecord>
        );
    };
});
