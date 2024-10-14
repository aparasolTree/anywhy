import { HttpError, page } from "fresh";
import { join } from "@std/path/join";
import { define } from "../../utils/define.ts";
import { parse } from "../../utils/html.ts";
import { Code } from "../../components/Code.tsx";
import { Heading } from "../../components/Heading.tsx";
import { Anchor } from "../../components/Anchor.tsx";
import { Blockquote } from "../../components/Blockquote.tsx";
import { Paragraph } from "../../components/Paragraph.tsx";
import { PreactMarkdown } from "../../components/PreactMarkdown.tsx";
import { CodeSnippet } from "../../components/CodeSnippet.tsx";
import { renderMarkdown } from "../../utils/renderMarkdown.ts";
import { Header } from "../../components/Header.tsx";
import { getBlogList } from "../../utils/blog.ts";
import { BackSVG } from "../../components/svg/BackSVG.tsx";
import { getBlogViews, setBlogViews } from "../../utils/kv/blog.kv.ts";

export const handler = define.handlers({
    async GET({ params, state }) {
        const readedFile = join(params.name, "/index.md");
        const { blogs } = await getBlogList();
        const exists = blogs.some(({ filename }) => filename === params.name);
        if (!exists) throw new HttpError(404);
        await setBlogViews(params.name);
        const { attrs, html } = await renderMarkdown(readedFile);
        state.title = attrs.title;
        state.description = attrs.description;
        return page({
            markdown: html,
            attrs,
            views: await getBlogViews(params.name),
        });
    },
});

export default define.page<typeof handler>(({ data, url, state }) => {
    const { user } = state;
    const { markdown, attrs, views } = data;
    return (
        <div>
            <Header active={url.pathname} user={user} className="bg-white" />
            <div class="px-[200px] py-4 scroll-pt-14">
                <a href="/blog" class="mb-10 text-blue-950 flex gap-3 items-center hover:text-red-500 text-xl">
                    <BackSVG /> 返回预览
                </a>
                <div class="my-6 px-4 border-b-2 border-gray-200 pb-4">
                    <h2 class="text-3xl mb-4">{attrs.title}</h2>
                    <div class="text-sm text-gray-500">
                        <time dateTime={attrs.date.toLocaleDateString()}>
                            {attrs.date.toLocaleDateString()}
                        </time>
                        <span class="ml-4">浏览量{views}</span>
                    </div>
                    <div class="my-3 flex gap-3">
                        {attrs.tags.map((tag) => (
                            <a
                                href={`/blog?tag=${tag}`}
                                class="rounded-md border-[1px] border-gray-200 px-3 py-1 text-gray-500 cursor-pointer hover:bg-gray-100"
                            >
                                {tag}
                            </a>
                        ))}
                    </div>
                </div>
                <div class="markdown-body font-sans text-base">
                    <PreactMarkdown
                        root={parse(markdown)}
                        map={{
                            pre: <CodeSnippet />,
                            code: <Code />,
                            heading: <Heading />,
                            a: <Anchor />,
                            blockquote: <Blockquote />,
                            p: <Paragraph />,
                        }}
                    />
                </div>
            </div>
        </div>
    );
});
