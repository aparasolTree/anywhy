import { define } from "../utils/define.ts";
import { getNotificationData } from "../utils/kv/notify.ts";
import { json } from "../utils/response.ts";

export const handler = define.handlers(async ({ url }) => {
    const data = await getNotificationData();
    const id = url.searchParams.get("id");
    return json(data.id === id ? null : data);
});
