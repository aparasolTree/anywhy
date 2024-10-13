import { define } from "../../../utils/define.ts";
import { getAccess, getMonthsAccess } from "../../../utils/kv/access.kv.ts";
import { badRequest, json } from "../../../utils/response.ts";

export const handler = define.handlers({
    async GET({ url }) {
        const year = Number(url.searchParams.get("year")) || (new Date()).getFullYear();
        const yearAccess = await getMonthsAccess(year);
        if (yearAccess.length === 0) return badRequest(`${year}年份，数据不存在`);
        return json({
            year,
            total: (await getAccess()).totalAccess,
            access: Array.from({ length: 12 }, (_, i) => {
                const month = `${i + 1}`.padStart(2, "0");
                return { month, access: yearAccess.find((y) => y.month === month)?.access || 0 };
            }),
        });
    },
});
