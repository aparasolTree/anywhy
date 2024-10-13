import { define } from "../../../utils/define.ts";
import { formDataVerify } from "../../../utils/formDataVerify.ts";
import { getImageCSV, setImageEntryByCSV } from "../../../utils/kv/image.kv.ts";
import { getUserCSV, setUserEntryByCSV } from "../../../utils/kv/user.kv.ts";
import { badRequest, json } from "../../../utils/response.ts";

export const handler = define.handlers({
    async GET({ url }) {
        const csv = url.searchParams.get("csv");
        let result: { readable: ReadableStream<Uint8Array>; total: number };
        switch (csv) {
            case "image":
                result = await getImageCSV();
                break;
            case "user":
                result = await getUserCSV();
                break;
            default:
                return badRequest(`${csv} 数据不存在`);
        }
        return new Response(result.readable, {
            status: 200,
            headers: {
                "Content-Type": "text/csv; charset=utf8",
                "X-Rows": String(result.total),
            },
        });
    },
    async POST({ req }) {
        const [error, { csv, type }] = formDataVerify(await req.formData(), {
            csv: { type: "File", required: true, extname: ".csv" },
            type: {
                type: "String",
                required: true,
                custom: (_, val) => {
                    return ["image", "user"].includes(val) ? "" : `key: ${val} 加载${val}数据不支持`;
                },
            },
        });
        if (error) return badRequest(error);
        const stream = csv.stream();
        switch (type) {
            case "image":
                await setImageEntryByCSV(stream);
                break;
            case "user":
                await setUserEntryByCSV(stream);
                break;
            default:
                return badRequest(`key=${type} 无法处理${type}`);
        }
        return json({ ok: true });
    },
});
