import { define } from "../../../utils/define.ts";
import { json } from "../../../utils/response.ts";
import { cache } from "../../image/[...name].ts";

export const handler = define.handlers({
    GET() {
        return json({
            size: cache.getCachedSize(),
            count: cache.getCachedImageCount(),
        });
    },
});
