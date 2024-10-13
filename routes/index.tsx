import { page } from "fresh";
import { define } from "../utils/define.ts";
import { Header } from "../components/Header.tsx";
import { getLoginInfoSession } from "../utils/login.session.ts";
import { Toast } from "../islands/Toast.ts";
import { getImageEntries } from "../utils/kv/image.kv.ts";

export const handler = define.handlers({
    async GET({ req }) {
        const loginInfoSession = await getLoginInfoSession(req);
        const error = loginInfoSession.getError();
        const { data } = await getImageEntries({
            pipe: [
                (entries) => entries.toSorted((a, b) => b.views - a.views),
                (entries) => entries.slice(0, 6),
            ],
        });
        return page({ error, data }, {
            headers: await loginInfoSession.getHeaders(),
        });
    },
});

export default define.page<typeof handler>(function Home({ data, url, state }) {
    const { error } = data;
    return (
        <>
            <Header active={url.pathname} user={state.user} className="!absolute" />
            <Toast type="error" message={error} />
            <div class="fixed w-screen h-screen bg-red-500 rounded-sm -left-1/2 -top-1/2 rotate-45" />
            <div class="fixed w-screen h-screen bg-red-500 rounded-sm -right-1/2 -bottom-1/2 rotate-45" />
            <div class="fixed left-0 top-0 bottom-0 right-0 z-10 flex justify-center items-center backdrop-blur-sm">
                <div class="p-5 rounded-md bg-white shadow-md">
                    <p class="text-3xl text-center">( •̀ ω •́ )y 呦！！！</p>
                    <p class="my-4">
                        欢迎来到我的摄影世界！每一张照片都是一段故事，
                        记录着光影中的瞬间与情感。请随意探索我的作品集，感受镜头背后的精彩旅程。
                    </p>
                    <a href="/image" class="bg-green-500 p-2 rounded-md text-white">
                        前往作品页面
                    </a>
                </div>
            </div>
        </>
    );
});
