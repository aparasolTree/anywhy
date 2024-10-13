import { parseArgs } from "@std/cli/parse-args";
import { createCommandLineHandler } from "../command.ts";
import { fetcher } from "../fetcher.ts";
import { usePromise } from "../../hooks/usePromise.ts";
import { CommandRecord } from "../../components/CommandRecord.tsx";
import { Case, Switch } from "../../islands/Switch.tsx";
import { CommandLineLoading } from "../../components/CommandLineLoading.tsx";
import { CommandLineError } from "../../components/CommandLineError.tsx";
import { Table, TableColumn } from "../../islands/Table.tsx";
import { createFetcherURL } from "../common.ts";

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

type BlogData = { total: number; list: { title: string; views: number }[]; page: number; limit: number };
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
                <Switch when={status} keepAlive={false} animation={false}>
                    <Case value="loading" content={<CommandLineLoading />} />
                    <Case value="error" content={<CommandLineError errorMessage={msg} />} />
                    <Case
                        value="idle"
                        content={data
                            ? (
                                <>
                                    <div class="mb-4">
                                        查询到的数据共{data.total}条 共{Math.ceil(data.total / Number(limit))}页
                                        当前第{data.page}页 {data.list.length}条
                                    </div>
                                    <Table data={data.list}>
                                        <TableColumn dataKey="title" title="标题" />
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
