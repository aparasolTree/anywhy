import { RouteConfig } from "fresh";
import { define } from "../../utils/define.ts";
import { getImageEntry, setImageViews } from "../../utils/kv/image.kv.ts";
import { json } from "../../utils/response.ts";

export const handler = define.handlers({
    async GET({ params }) {
        if (await getImageEntry(params.id)) {
            await setImageViews(params.id);
        }
        return json("");
    },
});

export const config: RouteConfig = {
    routeOverride: "/image/views/:id",
};
