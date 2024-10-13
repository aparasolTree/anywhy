enum TOKEN {
    INIT,

    TAG_OPEN,
    TAG_CLOSE,

    TAG_ATTR_KEY,
    TAG_ATTR_VAL,
    TAG_ATTR_END,

    TAG_NAME,
    TAG_NAME_END,

    TEXT,
}

const tagReg = /[a-zA-Z0-9\-]+/;
function isTag(str: string) {
    return tagReg.test(str);
}

type Token =
    | { type: "tag"; tag: string }
    | { type: "attr"; key: string; val: string }
    | { type: "text"; text: string }
    | { type: "tagEnd"; tag: string };

export function tokenize(html: string) {
    html = html.trim();
    const tokens: Token[] = [];

    let chars: string = "";
    let state = TOKEN.INIT;

    let attr_key: string = "";
    let attr_val: string = "";
    let quoteMark: string = "";
    let tag: string = "";

    let char: string = "";
    let i = 0;
    const length = html.length;
    while (i < length) {
        char = html[i];
        switch (state) {
            case TOKEN.INIT: {
                if (char === "<") {
                    state = TOKEN.TAG_OPEN;
                    i++;
                } else {
                    state = TOKEN.TEXT;
                    chars += char;
                    i++;
                }
                break;
            }
            case TOKEN.TEXT: {
                if (char === "<") {
                    tokens.push({ type: "text", text: chars });
                    chars = "";
                    state = TOKEN.TAG_OPEN;
                    i++;
                } else {
                    chars += char;
                    i++;
                }
                break;
            }
            case TOKEN.TAG_OPEN: {
                if (isTag(char)) {
                    state = TOKEN.TAG_NAME;
                    chars += char;
                    i++;
                } else if (char === "/") {
                    state = TOKEN.TAG_CLOSE;
                    i++;
                }
                break;
            }
            case TOKEN.TAG_CLOSE: {
                if (isTag(char)) {
                    chars += char;
                    i++;
                } else if (char === ">") {
                    tokens.push({ type: "tagEnd", tag: chars });
                    state = TOKEN.INIT;
                    chars = "";
                    i++;
                }
                break;
            }
            case TOKEN.TAG_NAME: {
                if (isTag(char)) {
                    chars += char;
                    i++;
                } else if (char === " ") {
                    tag = chars;
                    tokens.push({ type: "tag", tag });
                    chars = "";
                    i++;
                    while (html[i] === " ") i++;
                    state = TOKEN.TAG_NAME_END;
                } else if (char === ">") {
                    tag = chars;
                    tokens.push({ type: "tag", tag });
                    chars = "";
                    i++;
                    state = TOKEN.TEXT;
                } else if (char === "/") {
                    tokens.push({ type: "tagEnd", tag });
                    tag = "";
                    i++;
                    while (html[i] === " ") i++;
                    if (html[i] !== ">") throw new Error("自闭和标签闭合错误");
                    i++;
                    state = TOKEN.INIT;
                }
                break;
            }
            case TOKEN.TAG_NAME_END: {
                if (char === ">") {
                    i++;
                    state = TOKEN.TEXT;
                } else if (isTag(char)) {
                    chars += char;
                    i++;
                    state = TOKEN.TAG_ATTR_KEY;
                } else if (char === "/") {
                    tokens.push({ type: "tagEnd", tag });
                    tag = "";
                    i++;
                    while (html[i] === " ") i++;
                    if (html[i] !== ">") throw new Error("自闭和标签闭合错误");
                    i++;
                    state = TOKEN.INIT;
                }
                break;
            }
            case TOKEN.TAG_ATTR_KEY: {
                if (isTag(char)) {
                    chars += char;
                    i++;
                } else if (char === "=") {
                    attr_key = chars;
                    chars = "";
                    i++;
                    state = TOKEN.TAG_ATTR_VAL;
                }
                break;
            }
            case TOKEN.TAG_ATTR_VAL: {
                if (char === `"` || char === `'`) {
                    if (!quoteMark) {
                        quoteMark = char;
                        i++;
                    } else {
                        if (char === quoteMark) {
                            attr_val = chars;
                            tokens.push({ type: "attr", key: attr_key, val: attr_val });
                            attr_key = "";
                            attr_val = "";
                            quoteMark = "";
                            chars = "";
                            i++;
                            state = TOKEN.TAG_ATTR_END;
                            break;
                        }
                        throw new Error(`引号匹配错误：起始引号为：${quoteMark}，结束引号为：${char}`);
                    }
                } else if (char === ">") {
                    i++;
                    state = TOKEN.INIT;
                } else {
                    chars += char;
                    i++;
                }
                break;
            }
            case TOKEN.TAG_ATTR_END: {
                if (isTag(char)) {
                    chars += char;
                    i++;
                    state = TOKEN.TAG_ATTR_KEY;
                } else if (char === ">") {
                    i++;
                    state = TOKEN.INIT;
                } else if (char === "/") {
                    tokens.push({ type: "tagEnd", tag });
                    tag = "";
                    i++;
                    while (html[i] === " ") i++;
                    if (html[i] !== ">") throw new Error("自闭和标签闭合错误");
                    i++;
                    state = TOKEN.INIT;
                } else if (char === " ") {
                    while (html[i] === " ") i++;
                }
            }
        }
    }
    return tokens;
}

export type ElementNode = {
    type: "element";
    tag: string;
    children: (ElementNode | TextNode)[];
    props: Record<string, string>;
};
export type TextNode = { type: "text"; content: string };
export type RootNode = { type: "root"; children: (ElementNode | TextNode)[] };

export function parse(html: string) {
    const tokens = tokenize(html);
    const root: RootNode = { type: "root", children: [] };
    const stack: (ElementNode | RootNode)[] = [root];
    const length = tokens.length;
    let index = 0;
    while (index < length) {
        const parent = stack[stack.length - 1];
        const t = tokens[index];
        switch (t.type) {
            case "tag": {
                const element: ElementNode = {
                    type: "element",
                    tag: t.tag,
                    props: {},
                    children: [],
                };
                parent.children.push(element);
                stack.push(element);
                break;
            }
            case "attr": {
                if (parent.type === "element") {
                    parent.props[t.key] = t.val;
                }
                break;
            }
            case "text": {
                parent.children.push({ type: "text", content: t.text });
                break;
            }
            case "tagEnd":
                stack.pop();
                break;
            default:
                break;
        }
        index++;
    }
    return root;
}
// console.time("start");
// tokenize(await renderMarkdown());
// console.timeEnd("start");
