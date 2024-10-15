import { concat } from "@std/bytes/concat";
import { assert, bytesConversion } from "./common.ts";
import { getValues, kv } from "./kv/index.ts";

const CACHE_MAX_SIZE = 100 * 1024 * 1024;
const MAX_BYTES = 65536;

const CACHE_KEY = "CACHE_KEY";
const CACHE_HEADER_KEY = "CACHE_HEADER_KEY";
const CACHE_DATA_KEY = "CACHE_DATA_KEY";
const CACHE_URL_KEY = "CACHE_URL_KEY";
const CACHE_TOTAL_KEY = "CACHE_TOTAL_KEY";
const CACHE_SIZE_KEY = "CACHE_SIZE_KEY";

function createImageCache(
    { expireIn = 1000 * 60 * 60 * 24 }: { expireIn?: number } = {},
) {
    const HEADER_KEY = [CACHE_KEY, CACHE_HEADER_KEY];
    const DATA_KEY = [CACHE_KEY, CACHE_DATA_KEY];
    const URL_KEY = [CACHE_KEY, CACHE_URL_KEY];
    const TOTAL_KEY = [CACHE_KEY, CACHE_TOTAL_KEY];
    const SIZE_KEY = [CACHE_KEY, CACHE_SIZE_KEY];

    const getCachedInfo = () => getValues<[Deno.KvU64, Deno.KvU64]>([SIZE_KEY, TOTAL_KEY]);

    async function sliceCache(request: Request, value: Uint8Array) {
        const length = value.byteLength;
        const cycleTimes = length / MAX_BYTES;
        for (let i = 0; i < cycleTimes; i++) {
            await kv.atomic().set(
                [...DATA_KEY, request.url, i],
                value.slice(i * MAX_BYTES, (i + 1) * MAX_BYTES),
                { expireIn },
            ).commit();
        }
    }

    async function getCachedData(request: Request) {
        const result: Uint8Array[] = [];
        const listIter = kv.list<Uint8Array>({ prefix: [...DATA_KEY, request.url] });
        for await (const { value } of listIter) {
            result.push(value);
        }
        return concat(result).buffer;
    }

    async function getHeaders(request: Request) {
        const { value } = await kv.get<[string, string][]>([...HEADER_KEY, request.url]);
        return new Headers(value || []);
    }

    const assertSaveSpace = async () => {
        const [size] = await getCachedInfo();
        const sizeNum = Number(size);
        assert(
            sizeNum <= CACHE_MAX_SIZE,
            `存储空间已满，当前大小${bytesConversion(sizeNum)}，最大空间：${bytesConversion(CACHE_MAX_SIZE)}`,
        );
    };
    return {
        getCachedInfo,
        has: async (request: Request) => {
            request = ignoreSearchParams(request);
            return !!(await kv.get([...URL_KEY, request.url])).value;
        },
        get: async (request: Request) => {
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
            await sliceCache(request, data);
            await kv.atomic()
                .set([...HEADER_KEY, request.url], headers, { expireIn })
                .set([...URL_KEY, request.url], true, { expireIn })
                .sum(TOTAL_KEY, 1n)
                .sum(SIZE_KEY, BigInt(data.length))
                .commit();
        },
        clear: async () => {
            const listIter = kv.list({ prefix: [CACHE_KEY] });
            let atomic = kv.atomic();
            for await (const { key } of listIter) {
                atomic = atomic.delete(key);
            }
            await atomic.commit();
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

export const imageCache = createImageCache();
