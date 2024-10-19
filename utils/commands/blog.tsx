import { parseArgs } from "@std/cli/parse-args";
import { createCommandLineHandler } from "../command.ts";
import { fetcher } from "../fetcher.ts";
import { usePromise } from "../../hooks/usePromise.ts";
import { CommandRecord } from "../../islands/CommandRecord.tsx";
import { Case, Switch } from "../../islands/Switch.tsx";
import { CommandLineLoading } from "../../components/CommandLineLoading.tsx";
import { CommandLineError } from "../../components/CommandLineError.tsx";
import { Table, TableColumn } from "../../islands/Table.tsx";
import { createFetcherURL } from "../common.ts";
import { formatDate } from "../formatDate.ts";

export const blogCommand = createCommandLineHandler("blog", {
    parse: (args) =>
        parseArgs(args, {
            string: ["page", "limit"],
            boolean: ["list"],
            default: { page: "1", limit: "1" },
            unknown: (_, key) => {
                console.log(_);
                throw new Error(`image命令 无法解析 ${key} 参数。`);
            },
        }),
});

type BlogData = { total: number; list: { title: string; views: number; date: number; tags: string[] }[]; page: number; limit: number };
function fetchBlogList(page: string, limit: string) {
    return fetcher<BlogData>(
        createFetcherURL("/admin/api/blog", { page, limit }),
    );
}

blogCommand.add(({ list, limit, page }) => {
    if (!list) return null;
    const blogData = fetchBlogList(page, limit);
    return ({ command }) => {
        const { data, status, msg } = usePromise(blogData, []);
        return (
            <CommandRecord command={command}>
                <Switch when={status}>
                    <Case value="loading" content={<CommandLineLoading />} />
                    <Case value="error" content={<CommandLineError errorMessage={msg} />} />
                    <Case
                        value="idle"
                        content={data
                            ? (
                                <>
                                    <div class="mb-4">
                                        查询到的数据共{data.total}条 共{Math.ceil(data.total / Number(limit))}页 当前第{data.page}页 {data.list.length}条
                                    </div>
                                    <Table data={data.list}>
                                        <TableColumn dataKey="title" title="标题" />
                                        <TableColumn dataKey="date" title="创建日期" render={(date: string) => formatDate(new Date(date), "YYYY/MM/DD")} />
                                        <TableColumn
                                            dataKey="tags"
                                            title="标签"
                                            render={(tags: string[]) => (
                                                <ul class="flex gap-2 items-center">
                                                    {tags.map((tag) => (
                                                        <li class="bg-green-500 px-3 py-[2px] text-sm text-white rounded-md">
                                                            {tag}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        />
                                        <TableColumn dataKey="views" title="浏览量" />
                                    </Table>
                                </>
                            )
                            : null}
                    />
                </Switch>
            </CommandRecord>
        );
    };
});
