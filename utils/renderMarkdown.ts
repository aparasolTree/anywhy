import { render, Renderer } from "@deno/gfm";

import "npm:prismjs@1.29.0/components/prism-jsx.js";
import "npm:prismjs@1.29.0/components/prism-tsx.js";
import "npm:prismjs@1.29.0/components/prism-json.js";
import "npm:prismjs@1.29.0/components/prism-typescript.js";
import "npm:prismjs@1.29.0/components/prism-bash.js";
import "npm:prismjs@1.29.0/components/prism-git.js";

import { extractYaml } from "@std/front-matter";
import { join } from "@std/path/join";
import { BlogAttrs } from "./blog.ts";

const PRE_REG = /<pre(\s*[^>]*)?>?([\s\S]*)<\/pre>/;
const TIP_REG = /^<p>\[(notice|warn)\]:\s*?/;
const CODE_EXAMPLE_REG = /^\[example:\s*([\s\S]*)\]$/;

function slugger() {
    const HeadingTitleCached = new Set<string>();
    return function (str: string) {
        let idIndex = 0;
        let result = str.toLowerCase().replaceAll(/\s+/g, "-");
        while (HeadingTitleCached.has(result)) {
            result += "-" + idIndex++;
        }
        return result;
    };
}

class CustomRender extends Renderer {
    #slugger = slugger();
    heading(text: string, level: 1 | 2 | 3 | 4 | 5 | 6, raw: string): string {
        const id = this.#slugger(raw);
        return `<h${level} tabindex="-1" id="${id}">${text}</h${level}>`;
    }

    paragraph(text: string): string {
        const match = text.match(CODE_EXAMPLE_REG);
        if (match) {
            return `<p code="${match[1]}"></p>`;
        }
        return super.paragraph(text);
    }

    blockquote(quote: string): string {
        let tip: string = "";
        const match = quote.match(TIP_REG);
        if (match) {
            tip = match[1];
        }
        return `<blockquote${tip ? ` tip="${tip}"` : ""}>${
            quote.slice(0, 3) + quote.slice(3 + (match?.[0].length || 3) - 3)
        }</blockquote>`;
    }

    code(code: string, info?: string): string {
        let lang = "", title = "";
        const match = info?.match(/^([\w_-]+)\s*(.*)?$/);
        if (match) {
            lang = match[1].toLocaleLowerCase();
            title = match[2] ?? "";
        }
        const content = super.code(code, lang);
        const cotnentMatch = content.match(PRE_REG);
        let html = "";
        if (cotnentMatch) {
            const codeSnippet = cotnentMatch[2];
            html += `<pre class="language-${lang}" title="${title}">${codeSnippet}</pre>`;
        }
        return html || content;
    }
}

export async function renderMarkdown(path: string) {
    const url = new URL(join("../doc/", path), import.meta.url);
    const { body, attrs } = extractYaml<BlogAttrs>(await Deno.readTextFile(url));
    const html = render(body, {
        renderer: new CustomRender(),
        disableHtmlSanitization: true,
    });
    return {
        html,
        attrs,
    };
}
