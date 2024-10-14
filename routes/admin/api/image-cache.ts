import { define } from "../../../utils/define.ts";
import { imageCache } from "../../../utils/image-cache.ts";
import { json } from "../../../utils/response.ts";

export const handler = define.handlers({
    async GET() {
        const [size, total] = await imageCache.getCachedInfo();
        return json({
            size: Number(size.value),
            total: Number(total.value),
        });
    },
});
