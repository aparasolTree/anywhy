import { page } from "fresh";
import { Partial } from "fresh/runtime";
import { Header } from "../../components/Header.tsx";
import { define } from "../../utils/define.ts";
import { BlogAttrs, getBlogList } from "../../utils/blog.ts";
import { CopyButton } from "../../islands/CopyButton.tsx";
import { Tags } from "../../components/Tags.tsx";

export const handler = define.handlers({
    async GET({ state }) {
        state.title = "我的编程博客";
        state.description = "在这里你可以找到有趣的 JavaScript 示例，助你更好地应用编程。";
        return page(await getBlogList());
    },
});

export default define.page<typeof handler>(function Blog({ url, state, data }) {
    const searchTag = url.searchParams.get("tag") || "all";
    const { user } = state;
    const { tags, blogs, total } = data;
    console.log(tags);
    const currentUrl = `${url.origin}${url.pathname}/`;
    return (
        <div>
            <Header active={url.pathname} user={user} className="bg-white" />
            <main class="mx-[200px] py-8" f-client-nav={true}>
                <h2 class="text-4xl text-center my-20">
                    Blog <span class="text-xl">({total})</span>
                </h2>
                <Partial name="blog-list">
                    <Tags tags={tags} currentTag={searchTag} />
                    <div class="grid grid-cols-3 gap-6">
                        {slice(
                            blogs
                                .filter(({ attrs }) => attrs.tags.includes(searchTag)),
                            3,
                        ).map((col) => (
                            <div>
                                {col.map(({ attrs, filename }) => <BlogOverview {...attrs} routePath={currentUrl + filename} />)}
                            </div>
                        ))}
                    </div>
                </Partial>
            </main>
        </div>
    );
});

function slice<T>(array: T[], length: number) {
    let index = 0;
    const len = Math.floor(array.length / length);
    const result = Array.from({ length }, (_, i) => {
        index = (i + 1) * len;
        return array.slice(i * len, (i + 1) * len);
    });

    for (let i = index; i < array.length; i++) {
        result[i % length].push(array[i]);
    }
    return result;
}

interface BlogOverviewProps extends BlogAttrs {
    routePath: string;
}
function BlogOverview({
    routePath,
    title,
    description,
    tags,
    date,
    bannerSrc,
}: BlogOverviewProps) {
    return (
        <div class="relative group my-6">
            <a href={routePath} f-client-nav={false}>
                <img src={bannerSrc} alt="bolg banner" class="rounded-md" />
                <div class="flex justify-between mt-4">
                    <time dateTime={date.toLocaleDateString()} class="text-sm">
                        {date.toLocaleDateString()}
                    </time>
                    <ul class="text-sm text-gray-400">
                        {tags.map((tag) => <li class="my-1">{tag}</li>)}
                    </ul>
                </div>
                <h3 class="text-xl text-[#333] group-hover:underline">{title}</h3>
                <p class="text-xs text-gray-400 mt-2">{description}</p>
            </a>
            <div class="group-hover:block hidden absolute top-5 right-5">
                <CopyButton
                    text={routePath}
                    content={
                        <span class="text-white bg-green-500 rounded-md px-4 py-2">
                            复制当前文章链接
                        </span>
                    }
                />
            </div>
        </div>
    );
}
