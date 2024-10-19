import { CommandLineError } from "../../components/CommandLineError.tsx";
import { CommandLineLoading } from "../../components/CommandLineLoading.tsx";
import { CommandRecord } from "../../islands/CommandRecord.tsx";
import { usePromise } from "../../hooks/usePromise.ts";
import { Case, Switch } from "../../islands/Switch.tsx";
import { createCommandLineHandler } from "../command.ts";
import { fetcher } from "../fetcher.ts";

export const emailCommand = createCommandLineHandler("email");

emailCommand.add(() => {
    const emailSentCount = fetcher<{ count: number }>("/admin/api/email");
    return ({ command }) => {
        const { data, status, msg } = usePromise(emailSentCount, []);
        return (
            <CommandRecord command={command}>
                <Switch when={status}>
                    <Case value="error" content={<CommandLineError errorMessage={msg} />} />
                    <Case value="loading" content={<CommandLineLoading tip="数据请求中..." />} />
                    <Case value="idle" content={data ? <div>邮件共发送 {data.count} 条</div> : null} />
                </Switch>
            </CommandRecord>
        );
    };
});
