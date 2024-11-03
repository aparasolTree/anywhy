import { page } from "fresh";
import { Header } from "../../components/Header.tsx";
import { define } from "../../utils/define.ts";
import { getImageEntries, getImageTotal } from "../../utils/kv/image.kv.ts";
import { ImagePreview } from "./(_islands)/ImagePreview.tsx";
import { BackToTop } from "./(_islands)/BackToTop.tsx";
import { clamp, getErrorMessage, validateNumber } from "../../utils/common.ts";
import { badRequest, json } from "../../utils/response.ts";
import { getUserSession } from "../../utils/user.session.ts";

export const handler = define.handlers({
    async GET({ req, url, state }) {
        const isJOSN = req.headers.get("Content-Type") === "application/json";
        const { page: cursor = "1", limit = "8" } = Object.fromEntries(url.searchParams);
        try {
            const pageNum = clamp(validateNumber(cursor, "page"), 1, Infinity);
            const limitNum = clamp(validateNumber(limit, "limit"), 1, 100);

            const start = isJOSN ? (pageNum - 1) * limitNum : 0;
            const end = isJOSN ? pageNum * limitNum : limitNum;

            const { data: imageEntries, total } = await getImageEntries({
                pipe: [
                    (entries) => entries.slice(start, end),
                ],
            });

            const result = {
                page: pageNum,
                imageEntries,
                limit: limitNum,
                done: total <= end,
                total: await getImageTotal(),
            };

            state.title = "我的个人作品";
            state.description = "个人的摄影作品，可在任何地方使用，免费下载，无需注明归属";
            return isJOSN ? json(result) : page({
                ...result,
                isAdmin: (await (await getUserSession(req)).getUser())?.role === "admin",
            });
        } catch (error) {
            return badRequest(getErrorMessage(error));
        }
    },
});

export default define.page<typeof handler>(({ state, url, data }) => {
    const { imageEntries, page, limit, total, isAdmin } = data;
    return (
        <div>
            <Header active={url.pathname} user={state.user} className="bg-white" />
            <h2 class="text-4xl text-center py-20">
                Image <span class="text-xl">({total})</span>
            </h2>
            <main class="px-[200px] py-6">
                <h3 class="mb-6 text-2xl">个人摄影作品展示</h3>
                <ImagePreview
                    page={page}
                    limit={limit}
                    isAdmin={isAdmin}
                    imageEntries={imageEntries}
                />
            </main>
            <BackToTop />
        </div>
    );
});
