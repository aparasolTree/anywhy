import { bytesConversion, isArray, isFile, isFunction, isString } from "./common.ts";
import { extname as fileExtname } from "@std/path";

export type VerifyOptions = {
    type: "String";
    required?: boolean;
    maxLength?: number;
    minLength?: number;
    custom?: (key: string, value: string) => string;
} | {
    type: "File";
    size?: number;
    extname?: string[] | string;
    required?: boolean;
    custom?: (key: string, value: File) => string;
} | {
    type: "Files";
    maxLength?: number;
    extname?: string[] | string;
    size?: number;
    required?: boolean;
    custom?: (key: string, value: File[]) => string;
};

export type VerifyRecord = Record<string, VerifyOptions>;
export function formDataVerify<T extends VerifyRecord>(
    formData: FormData,
    options: T,
) {
    const data = Object.fromEntries(
        Object.entries(options).map(([key, { type }]) => {
            return [key, getFormDataValue(formData, type, key)];
        }),
    );

    let error: string = "";
    out: for (const [key, value] of Object.entries(data)) {
        const opt = options[key];
        error = type(key, value, opt);
        if (error) break;
        for (const optKey in opt) {
            if (optKey === "type") continue;
            error = verifyMethods[optKey as keyof typeof verifyMethods](
                key,
                value,
                opt,
            );
            if (error) break out;
        }
    }

    return [
        error,
        data as {
            [K in keyof T]: T[K]["type"] extends "String" ? string
                : T[K]["type"] extends "File" ? File : T[K]["type"] extends "Files" ? File[]
                : never;
        },
    ] as const;
}

// deno-lint-ignore no-explicit-any
type VerifyMethod = (key: string, value: any, opt: VerifyOptions) => string;

const custom: VerifyMethod = (key, value, { custom }) => {
    if (!isFunction(custom)) throw new Error("custom 必须为一个函数");
    return custom(key, value);
};

const required: VerifyMethod = (key, value, { required, type }) => {
    if (required) {
        let isEmpty: boolean = !!value;
        if (type === "Files") isEmpty = !!(value as File[]).length;
        return isEmpty ? "" : `${key}：数值不能为空`;
    }
    return "";
};

const type: VerifyMethod = (key, value, { type }) => {
    switch (type) {
        case "String":
            return isString(value) ? "" : `${key}：类型错误，需要String类型`;
        case "File":
            return isFile(value) ? "" : `${key}：类型错误，需要File类型`;
        case "Files":
            return isArray(value)
                ? value.every((val) => isFile(val)) ? "" : `${key}：上传的文件必须都是File类型`
                : `${key}：上传的文件必须是多个`;
        default:
            if (type == void 0) return "";
            return "当前类型不支持";
    }
};

const maxLength: VerifyMethod = (key, value, opt) => {
    switch (opt.type) {
        case "Files": {
            const maxLength = opt.maxLength || Infinity;
            return (value as File[]).length <= maxLength ? "" : `${key}：上传的文件数量不能大于 ${maxLength}`;
        }
        case "String": {
            const maxLength = opt.maxLength || Infinity;
            return (value as string).length <= maxLength ? "" : `${key}：上传的字符长度不能大于 ${maxLength}`;
        }
        default:
            return "当前类型不支持";
    }
};

const minLength: VerifyMethod = (key, value, opt) => {
    if (opt.type === "String") {
        const minLength = opt.minLength || 0;
        return (value as string).length > minLength ? "" : `${key}：上传的字符长度不能小于 ${minLength}`;
    }
    return "当前类型不支持";
};

const size: VerifyMethod = (key, value, opt) => {
    switch (opt.type) {
        case "File": {
            const size = opt.size || Infinity;
            return (value as File).size <= size ? "" : `${key}：上传的文件大小不能大于 ${bytesConversion(size)}`;
        }
        case "Files": {
            const size = opt.size || Infinity;
            return (value as File[]).every((file) => file.size <= size)
                ? ""
                : `${key}：上传的每个文件都不能大于 ${bytesConversion(size)}`;
        }
        default:
            return "当前类型不支持";
    }
};

const extname: VerifyMethod = (key, value, opt) => {
    switch (opt.type) {
        case "File": {
            const ext = Array.isArray(opt.extname) ? opt.extname : [opt.extname];
            return ext.includes(fileExtname((value as File).name)) ? "" : `${key}：文件后缀名错误 ${ext}`;
        }
        case "Files": {
            const ext = Array.isArray(opt.extname) ? opt.extname : [opt.extname];
            return (value as File[]).every((file) => ext.includes(fileExtname(file.name)))
                ? ""
                : `${key}：文件后缀名错误 ${ext}`;
        }
        default:
            return "当前类型不支持";
    }
};

const verifyMethods = { required, custom, maxLength, minLength, size, extname };

function getFormDataValue(
    formData: FormData,
    type: VerifyOptions["type"],
    key: string,
) {
    switch (type) {
        case "File":
            return formData.get(key);
        case "String":
            return formData.get(key);
        case "Files":
            return formData.getAll(key);
        default:
            return null;
    }
}
