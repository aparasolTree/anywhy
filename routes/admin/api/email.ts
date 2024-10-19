import { define } from "../../../utils/define.ts";
import { getMessageSentCount } from "../../../utils/email.ts";
import { json } from "../../../utils/response.ts";

export const handler = define.handlers(async () => {
    return json({
        count: await getMessageSentCount(),
    });
});
