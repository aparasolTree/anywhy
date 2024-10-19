import { parseArgs } from "@std/cli/parse-args";
import { createCommandLineHandler } from "../command.ts";
import { fetcher } from "../fetcher.ts";
import { usePromise } from "../../hooks/usePromise.ts";
import { CommandRecord } from "../../islands/CommandRecord.tsx";
import { Case, Switch } from "../../islands/Switch.tsx";
import { CommandLineLoading } from "../../components/CommandLineLoading.tsx";
import { CommandLineError } from "../../components/CommandLineError.tsx";
import { Chart, GridLine, LineChart, XAxis } from "../../islands/LineChart.tsx";

export const accessCommand = createCommandLineHandler("access", {
    parse: (args) =>
        parseArgs(args, {
            string: ["year"],
            boolean: ["reload"],
            default: { reload: false },
            unknown: (_, key) => {
                console.log(_);
                throw new Error(`image命令 无法解析 ${key} 参数。`);
            },
        }),
});

function fetchAccessData(year: string, reload: boolean) {
    type FetchAccessData = { access: { month: string; access: number }[]; year: number; total: number };
    return fetcher<FetchAccessData>("/admin/api/access?year=" + year, {
        reload,
    });
}

accessCommand.add(({ year = String(new Date().getFullYear()), reload }) => {
    const accessData = fetchAccessData(year, reload);
    return ({ command }) => {
        const { data, status, msg } = usePromise(accessData, []);
        return (
            <CommandRecord command={command}>
                <Switch when={status}>
                    <Case value="loading" content={<CommandLineLoading />} />
                    <Case value="error" content={<CommandLineError errorMessage={msg} />} />
                    <Case
                        value="idle"
                        content={data && (
                            <div class="p-5 rounded-md border-[1px] border-gray-300 inline-block bg-white">
                                <h3 class="font-bold">用户访问页面监控</h3>
                                <p class="mt-1 mb-4 text-[12px] text-gray-400">
                                    {data.year}年 {data.access.at(0)?.month} - {data.access.at(-1)?.month}
                                    <span class="ml-4">总访问量 {data.total}</span>
                                </p>
                                <Chart data={data.access} width={500} height={240} padding={20}>
                                    <GridLine />
                                    <LineChart dataKey="access" />
                                    <XAxis
                                        dataKey="month"
                                        formater={(text) => text.slice(0, 2)}
                                    />
                                </Chart>
                            </div>
                        )}
                    />
                </Switch>
            </CommandRecord>
        );
    };
});
