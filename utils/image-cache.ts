import { FreshContext } from "fresh";
import { concat } from "@std/bytes/concat";
import { assert, bytesConversion } from "./common.ts";

const CACHE_MAX_SIZE = 100 * 1024 * 1024;
const MAX_BYTES = 65536;

interface Options {
    maxAge: number;
    path: string;
    get: (ctx: FreshContext) => Promise<Response> | Response;
}

const CACHE_KEY = "CACHE_KEY";
const CACHE_HEADER_KEY = "CACHE_HEADER_KEY";
const CACHE_DATA_KEY = "CACHE_DATA_KEY";
const CACHE_URL_KEY = "CACHE_URL_KEY";

export async function createImageCache(
    path: string = ":memory:",
    { expireIn = 1000 * 60 * 60 * 24 }: { expireIn?: number } = {},
) {
    let saveSize = 0, count = 0;
    const cachedKv = await Deno.openKv(path);
    const HEADER_KEY = [CACHE_KEY, CACHE_HEADER_KEY];
    const DATA_KEY = [CACHE_KEY, CACHE_DATA_KEY];
    const URL_KEY = [CACHE_KEY, CACHE_URL_KEY];

    async function sliceCache(request: Request, value: Uint8Array) {
        const length = value.byteLength;
        const cycleTimes = length / MAX_BYTES;
        for (let i = 0; i < cycleTimes; i++) {
            await cachedKv.atomic().set(
                [...DATA_KEY, request.url, i],
                value.slice(i * MAX_BYTES, (i + 1) * MAX_BYTES),
                { expireIn },
            ).commit();
        }
    }

    async function getCachedData(request: Request) {
        const result: Uint8Array[] = [];
        const listIter = cachedKv.list<Uint8Array>({ prefix: [...DATA_KEY, request.url] });
        for await (const { value } of listIter) {
            result.push(value);
        }
        return concat(result).buffer;
    }

    async function getHeaders(request: Request) {
        const { value } = await cachedKv.get<[string, string][]>([...HEADER_KEY, request.url]);
        return new Headers(value || []);
    }

    const hasRemainingSpace = () => saveSize <= CACHE_MAX_SIZE;
    const assertSaveSpace = () => {
        assert(
            hasRemainingSpace(),
            `存储空间已满，当前大小${bytesConversion(saveSize)}，最大空间：${bytesConversion(CACHE_MAX_SIZE)}`,
        );
    };
    return {
        getCachedSize: () => saveSize,
        getCachedImageCount: () => count,
        getCachedPath: () => path,
        has: async (request: Request) => {
            request = ignoreSearchParams(request);
            return !!(await cachedKv.get([...URL_KEY, request.url])).value;
        },
        get: async (request: Request) => {
            assertSaveSpace();
            request = ignoreSearchParams(request);
            const headers = await getHeaders(request);
            headers.append("x-cache-hit", "true");
            headers.append("x-DenoKv-hit", "true");
            return new Response(await getCachedData(request), {
                headers,
            });
        },
        set: async (request: Request, response: Response) => {
            assertSaveSpace();
            request = ignoreSearchParams(request);
            const headers = [...response.headers.entries()];
            const data = new Uint8Array(await response.arrayBuffer());
            saveSize += data.length;
            await sliceCache(request, data);
            await cachedKv.atomic()
                .set([...HEADER_KEY, request.url], headers, { expireIn })
                .set([...URL_KEY, request.url], true, { expireIn })
                .commit();
            count++;
        },
    };
}

function ignoreSearchParams(request: Request) {
    const url = new URL(request.url);
    url.search = "";
    return {
        ...request,
        url: url.toString(),
    } as Request;
}
