import { parseArgs } from "@std/cli/parse-args";
import { createCommandLineHandler } from "../command.ts";
import { CommandRecord } from "../../components/CommandRecord.tsx";
import { fetcher } from "../fetcher.ts";
import { createFetcherURL } from "../common.ts";
import type { User } from "../kv/user.kv.ts";
import { usePromise } from "../../hooks/usePromise.ts";
import { Case, Switch } from "../../islands/Switch.tsx";
import { CommandLineLoading } from "../../components/CommandLineLoading.tsx";
import { CommandLineError } from "../../components/CommandLineError.tsx";
import { Table, TableColumn } from "../../islands/Table.tsx";
import type { ComponentChild } from "preact";
import { formatDate } from "../formatDate.ts";

export const userCommand = createCommandLineHandler("user", {
    parse: (args) =>
        parseArgs(args, {
            boolean: ["list"],
            string: ["page", "limit"],
            alias: { page: "p", limit: "l" },
        }),
});

function fetchUserList(page: string, limit: string) {
    return fetcher<{ list: User[]; total: number; page: number; limit: number }>(
        createFetcherURL("/admin/api/user", { page, limit }),
    );
}

const render: Partial<Record<keyof User, (val: User[keyof User]) => ComponentChild>> = {
    createAt: (val) => formatDate(new Date(val as number), "YYYY/MM/DD"),
};

const UserKeyMap: Record<keyof User, string> = {
    id: "id",
    role: "权限",
    username: "昵称",
    email: "邮箱",
    createAt: "创建时间",
};

userCommand.add(({ list, limit = "1", page = "1" }) => {
    if (!list) return null;
    const userList = fetchUserList(page, limit);
    return ({ command }) => {
        const { data, status, msg } = usePromise(userList, []);
        return (
            <CommandRecord command={command}>
                <Switch when={status}>
                    <Case value="loading" content={<CommandLineLoading />} />
                    <Case value="error" content={<CommandLineError errorMessage={msg} />} />
                    <Case
                        value="idle"
                        content={data
                            ? data.list.length
                                ? (
                                    <>
                                        <div class="mb-4">
                                            查询到的数据共{data.total}条 共{Math.ceil(data.total / data.limit)}页
                                            当前第{data
                                                .page}页
                                        </div>
                                        <Table data={data.list}>
                                            {Object.entries(UserKeyMap).map(([key, title]) => (
                                                <TableColumn
                                                    dataKey={key}
                                                    title={title}
                                                    render={render[key as keyof User]}
                                                />
                                            ))}
                                        </Table>
                                    </>
                                )
                                : <div>查询数据为空</div>
                            : null}
                    />
                </Switch>
            </CommandRecord>
        );
    };
});
