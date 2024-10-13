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
        remove: ["help", "cache", "reload"],
        list: ["remove", "help", "cache"],
        cache: ["help"],

        page: ["remove", "help", "cache"],
        limit: ["remove", "help", "cache"],
        pick: ["remove", "help", "cache"],
        order: ["remove", "help", "cache"],
        sort: ["remove", "help", "cache"],
        filter: ["remove", "help", "cache"],
        id: ["help", "list", "cache", "page", "limit", "pick", "order", "sort", "reload", "filter"],
    },
    parse: (args) =>
        parseArgs(args, {
            string: ["id", "page", "limit", "pick", "order", "sort", "filter"],
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
    const data = await fetcher<{ path: string; count: number; size: number }>("/admin/api/image-cache", { reload });
    return data;
};

imageCommand.add(({ cache, reload = false }) => {
    if (!cache) return null;
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
                                <TableColumn dataKey="path" title="缓存路径" />
                                <TableColumn dataKey="count" title="缓存数量" />
                                <TableColumn
                                    dataKey="size"
                                    title="已使用空间"
                                    render={(val) => `${bytesConversion(val)} / 100MB`}
                                />
                            </Table>
                        )}
                    />
                </Switch>
            </CommandRecord>
        );
    };
});

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
                                        查询到的数据共{data.total}条 共{Math.ceil(data.total / Number(limit))}页
                                        当前第{data.page}页 {data.imageEntries.length}条
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

// const imageCommandHelp = {
//     list: {
//         description: "获取图片数据",
//         example:
//             "image --list [-p/--page 1] [-l/--limit 1] [-f/--filter 'views>=10'] [-k/--pick id,name,views,downloads] [--reload]",
//         args: [
//             ["-p, --page <string> deault: 1", "当前页数"],
//             ["-l, --limit <string> deault: 1", "当前页数数据量限制"],
//             ["-f, --filter <string>", "数据过滤，多个限制条件之间使用 & 符号连接"],
//             ["-s, --sort <string> default: createAt", "通过指定的键对数据进行排序"],
//             ["-o, --order <string> default: des", "对数据进行降序或升序排序"],
//             ["--reload <boolean> default: false", "重新请求数据，并进行缓存"],
//             [
//                 `-k, --pick <string> default: ${Object.keys(entryKeyMap).join(",")}`,
//                 "对请求响应的数据对象进行指定键的选取，多个键之间使用 , 连接",
//             ],
//         ],
//     },
//     remove: {
//         description: "删除图片",
//         example: "image --remove --id [image-id]",
//         args: [
//             ["--id <string>", "指定图片id进行删除"],
//         ],
//     },
//     cache: {
//         description: "查看图片缓存",
//         example: "image --cache [--reload]",
//         args: [
//             ["--reload <boolean> default: false", "重新请求数据，并进行缓存"],
//         ],
//     },
//     help: {
//         description: "获取命令行参数提示",
//         example: "image --help",
//         args: [],
//     },
// };
// imageCommand.add(({ help }) => {
//     if (!help) return null;
//     return ({ command }) => (
//         <CommandRecord command={command}>
//             <p>获取图片数据/删除图片/查看图片缓存/获取帮助提示</p>
//             {Object.entries(imageCommandHelp).map(([command, { description, example, args }]) => {
//                 return (
//                     <div class="pl-4 my-4">
//                         <p class="text-xl text-red-500">{command}</p>
//                         <div class="pl-4">
//                             <p>{description}</p>
//                             <p class="text-gray-400">案例：{example}</p>
//                             <div class="pl-4 grid grid-cols-2">
//                                 {args.map(([option, optionDescription]) => (
//                                     <>
//                                         <span>{option}</span>
//                                         <span>{optionDescription}</span>
//                                     </>
//                                 ))}
//                             </div>
//                         </div>
//                     </div>
//                 );
//             })}
//         </CommandRecord>
//     );
// });
