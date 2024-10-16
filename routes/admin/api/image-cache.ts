import { define } from "../../../utils/define.ts";
import { imageDataCache } from "../../../utils/image-data-cache.ts";
import { json } from "../../../utils/response.ts";

export const handler = define.handlers({
    async GET() {
        const [size, total] = await imageDataCache.getCachedInfo();
        return json({
            size: Number(size.value),
            total: Number(total.value),
        });
    },
});
