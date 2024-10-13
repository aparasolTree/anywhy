// See: https://github.com/zloirock/core-js/blob/master/packages/core-js/modules/es.escape.js
const raw = /[\w*+\-./@]/;

export function escape(value: string) {
    value = value.toString();
    let result = "";
    let index = 0;
    let char: string, code: number;
    while (index < value.length) {
        char = value.charAt(index++);
        if (raw.test(char)) result += char;
        else {
            code = char.charCodeAt(0);
            if (code < 256) result += `%${code.toString(16).padStart(2, "0")}`;
            else {
                result += `%u${code.toString(16).padStart(4, "0").toUpperCase()}`;
            }
        }
    }
    return result;
}

export function unescape(value: string) {
    value = value.toString();
    let result = "";
    let index = 0;
    let char = "";
    let temp: string;
    while (index < value.length) {
        char = value.charAt(index++);
        if (char === "%") {
            if (value[index] === "u") {
                temp = value.slice(index + 1, index + 5);
                if (/^[\da-f]{4}$/i.test(temp)) {
                    result += String.fromCharCode(Number.parseInt(temp, 16));
                    index += 5;
                    continue;
                }
            } else {
                temp = value.slice(index, index + 2);
                if (/^[\da-f]{2}$/i.test(temp)) {
                    result += String.fromCharCode(Number.parseInt(temp, 16));
                    index += 2;
                    continue;
                }
            }
        }
        result += char;
    }
    return result;
}
