import { asset } from "fresh/runtime";
import { KATEX_CSS } from "@deno/gfm";
import Toaster from "../islands/toast/index.tsx";
import { CommandLine } from "../islands/CommandLine.tsx";
import { CrossPageRefresh } from "../islands/CrossPageRefresh.tsx";
import { define } from "../utils/define.ts";
import { ModalManager } from "../islands/Modal.tsx";

export default define.page(function App({ Component, state, url }) {
    const isLogin = !!state.user;
    const isAdmin = state.user?.role === "admin";
    return (
        <html>
            <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>anywhy</title>
                <link rel="stylesheet" href="/styles.css" />
                {url.pathname.startsWith("/blog") && (
                    <>
                        <style dangerouslySetInnerHTML={{ __html: KATEX_CSS }} />
                        <link rel="stylesheet" href={asset("/markdown.css")} />
                        <link rel="stylesheet" href={asset("/highlight.css")} />
                    </>
                )}
            </head>
            <body
                class="min-w-[1200px] font-sans"
                style={{
                    backgroundAttachment: "fixed",
                    backgroundImage:
                        `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cg fill='%23000000' fill-opacity='0.05'%3E%3Cpolygon fill-rule='evenodd' points='8 4 12 6 8 8 6 12 4 8 0 6 4 4 6 0 8 4'/%3E%3C/g%3E%3C/svg%3E"),
                        linear-gradient(to bottom, rgb(255, 255, 255), transparent 20%)`,
                }}
            >
                <ModalManager>
                    {isAdmin && <CommandLine />}
                    <Component />
                </ModalManager>
                <Toaster />
                <CrossPageRefresh isLogin={isLogin} />
            </body>
        </html>
    );
});
