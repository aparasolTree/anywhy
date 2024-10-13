import ExifReader from "npm:exifreader";
import { getValue, getValues, kv, list } from "./index.ts";
import {
    ANYWHY_KV_IMAGE_CREATEAT_KEY,
    ANYWHY_KV_IMAGE_DOWNLOADS_KEY,
    ANYWHY_KV_IMAGE_ID_KEY,
    ANYWHY_KV_IMAGE_KEY,
    ANYWHY_KV_IMAGE_TOTAL_KEY,
    ANYWHY_KV_IMAGE_VIEWS_KEY,
    ANYWHY_KV_KEY,
} from "../constant.ts";
import { uuid } from "../cropty.ts";
import { badRequest } from "../response.ts";
import { ExifInfo, ImageEntry, Size } from "../type.ts";
import { formatDate } from "../formatDate.ts";
import { CsvParseStream } from "@std/csv/parse-stream";
import { escape, unescape } from "../cookie/escape.ts";

export function createImageEntry(
    { name, exif, height, width, size }: Pick<ImageEntry, "exif" | "height" | "name" | "size" | "width">,
) {
    return {
        name,
        exif,
        width,
        height,
        size,
        id: uuid(),
        createAt: Date.now(),
    } as ImageEntry;
}

export async function createImage(imageEntry: ImageEntry) {
    const { id, createAt } = imageEntry;
    const ImageIdKey = [ANYWHY_KV_KEY, ANYWHY_KV_IMAGE_KEY, ANYWHY_KV_IMAGE_ID_KEY, id];
    const ImageTotalKey = [ANYWHY_KV_KEY, ANYWHY_KV_IMAGE_KEY, ANYWHY_KV_IMAGE_TOTAL_KEY];
    const ImageCreateAtKey = [
        ANYWHY_KV_KEY,
        ANYWHY_KV_IMAGE_KEY,
        ANYWHY_KV_IMAGE_CREATEAT_KEY,
        createAt,
    ];

    const { ok } = await kv.atomic()
        .check({ key: ImageIdKey, versionstamp: null })
        .check({ key: ImageCreateAtKey, versionstamp: null })
        .set(ImageIdKey, imageEntry)
        .set(ImageCreateAtKey, id)
        .sum(ImageTotalKey, 1n)
        .commit();

    if (!ok) {
        throw badRequest("图片数据可能已存在" + imageEntry.id);
    }
}

export async function setImageEntryByCSV(readable: ReadableStream<Uint8Array>) {
    const stream = readable
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(
            new CsvParseStream({ skipFirstRow: true, columns: ImageEntryKey }),
        );
    for await (const value of stream) {
        const { views, downloads, ...entry } = Object.fromEntries(
            Object.entries(value).map(([key, val]) => {
                return [key, JSON.parse(unescape(atob(val)))];
            }),
        );
        await setImageViews(entry.id, BigInt(views));
        await setImageDownloads(entry.id, BigInt(downloads));
        await createImage(entry as ImageEntry);
    }
}

export async function clearImageKvData() {
    const listIter = kv.list({ prefix: [ANYWHY_KV_KEY, ANYWHY_KV_IMAGE_KEY] });
    let atomic = kv.atomic();
    for await (const { key } of listIter) {
        atomic = atomic.delete(key);
    }
    const { ok } = await atomic.commit();
    if (!ok) {
        throw badRequest("清空图片数据错误，请尽快修复bug");
    }
}

const ImageEntryKey: (keyof ImageEntry)[] = [
    "id",
    "name",
    "createAt",
    "views",
    "downloads",
    "size",
    "exif",
    "height",
    "width",
];
const textEncode = new TextEncoder();
export async function getImageCSV() {
    const total = await getImageTotal() + 1;
    const listIter = kv.list<ImageEntry>({ prefix: [ANYWHY_KV_KEY, ANYWHY_KV_IMAGE_KEY, ANYWHY_KV_IMAGE_ID_KEY] });
    return {
        total,
        readable: new ReadableStream({
            async start(controller) {
                controller.enqueue(textEncode.encode(`${ImageEntryKey.join(",")}\n`));
                for await (const { value } of listIter) {
                    const views = await getImageViews(value.id);
                    const downloads = await getImageDownloads(value.id);
                    const entryData = { ...value, views, downloads };
                    controller.enqueue(
                        textEncode.encode(
                            `${
                                ImageEntryKey.map((key) => {
                                    const value = entryData[key];
                                    return btoa(escape(JSON.stringify(value)));
                                }).join(",")
                            }\n`,
                        ),
                    );
                }
                controller.close();
            },
        }),
    };
}

export async function getImageEntry(id: string) {
    const ImageIdKey = [ANYWHY_KV_KEY, ANYWHY_KV_IMAGE_KEY, ANYWHY_KV_IMAGE_ID_KEY, id];
    return await getValue<ImageEntry>(ImageIdKey);
}

export async function getImageEntries(
    { filter, pipe }: {
        filter?: (val: ImageEntry) => boolean;
        pipe?: ((val: ImageEntry[]) => ImageEntry[])[];
    },
) {
    const ImageIdKey = [ANYWHY_KV_KEY, ANYWHY_KV_IMAGE_KEY, ANYWHY_KV_IMAGE_ID_KEY];
    const { data, total } = await list(ImageIdKey, {
        pipe,
        filter,
        map: async (imgEntry) => ({
            ...imgEntry,
            views: await getImageViews(imgEntry.id),
            downloads: await getImageDownloads(imgEntry.id),
        }),
    });
    return {
        data,
        total,
    };
}
type a = () => Promise<{ a: 0 }>;
type b = Awaited<ReturnType<a>>;
export async function getImageEntriesFromDate(
    { page, limit }: { page: number; limit: number },
) {
    const ImageIdKey = [ANYWHY_KV_KEY, ANYWHY_KV_IMAGE_KEY, ANYWHY_KV_IMAGE_CREATEAT_KEY];
    const { data } = await list(ImageIdKey, {
        reverse: true,
        pipe: [
            (entries) => entries.slice((page - 1) * limit, page * limit),
        ],
        map: async (id: string) => {
            const entryData = await getImageEntry(id);
            if (!entryData) throw new Error(`${id} 无效`);
            return {
                ...entryData,
                views: await getImageViews(id),
                downloads: await getImageDownloads(id),
            };
        },
    });

    return data.reduce((acc, imageEntry) => {
        const date = formatDate(new Date(imageEntry.createAt), "YYYY/MM/DD");
        if (!acc[date]) acc[date] = [];
        acc[date].push(imageEntry);
        return acc;
    }, {} as Record<string, ImageEntry[]>);
}

export async function deleteImages(imageEntryIds: string[]) {
    const ImageTotalKey = [ANYWHY_KV_KEY, ANYWHY_KV_IMAGE_KEY, ANYWHY_KV_IMAGE_TOTAL_KEY];
    const deleteImageEntryNum = BigInt(imageEntryIds.length);
    const ImageIdKeys = imageEntryIds.map((id) => {
        return [ANYWHY_KV_KEY, ANYWHY_KV_IMAGE_KEY, ANYWHY_KV_IMAGE_ID_KEY, id];
    });
    const imageEntrys = await getValues<ImageEntry[]>(ImageIdKeys);
    const imageTotal = await getValue<Deno.KvU64>(ImageTotalKey) ||
        new Deno.KvU64(deleteImageEntryNum);

    const index = imageEntrys.findIndex((img) => !img);
    if (index !== -1) {
        throw badRequest("要删除的图片不存在 id：" + imageEntryIds[index]);
    }
    const ImageCreateAtKeys = (imageEntrys as ImageEntry[]).map(
        ({ createAt }) => {
            return [
                ANYWHY_KV_KEY,
                ANYWHY_KV_IMAGE_KEY,
                ANYWHY_KV_IMAGE_CREATEAT_KEY,
                createAt,
            ];
        },
    );

    let deleteAtomic = kv.atomic();
    for (let i = 0; i < imageEntryIds.length; i++) {
        deleteAtomic = deleteAtomic.delete(ImageIdKeys[i]).delete(ImageCreateAtKeys[i]);
    }
    deleteAtomic = deleteAtomic.set(
        ImageTotalKey,
        new Deno.KvU64(imageTotal.value - deleteImageEntryNum),
    );
    const { ok } = await deleteAtomic.commit();

    if (!ok) {
        throw badRequest("无法通过给予的 imageEntryIds 删除图片");
    }
}

export async function getImageTotal() {
    const ImageTotalKey = [ANYWHY_KV_KEY, ANYWHY_KV_IMAGE_KEY, ANYWHY_KV_IMAGE_TOTAL_KEY];
    return Number(
        (await getValue<Deno.KvU64>(ImageTotalKey))?.value ||
            0n,
    );
}

export async function setImageViews(imageId: string, count = 1n) {
    const ImageViewsKey = [ANYWHY_KV_KEY, ANYWHY_KV_IMAGE_KEY, ANYWHY_KV_IMAGE_VIEWS_KEY, imageId];
    const { ok } = await kv.atomic()
        .sum(ImageViewsKey, count)
        .commit();
    if (!ok) throw new Error("无效的 imageId");
}

export async function getImageViews(imageId: string) {
    const ImageViewsKey = [ANYWHY_KV_KEY, ANYWHY_KV_IMAGE_KEY, ANYWHY_KV_IMAGE_VIEWS_KEY, imageId];
    return Number(
        (await getValue<Deno.KvU64>(ImageViewsKey))?.value || 0,
    );
}

export async function setImageDownloads(imageId: string, count = 1n) {
    const ImageDownloadsKey = [ANYWHY_KV_KEY, ANYWHY_KV_IMAGE_KEY, ANYWHY_KV_IMAGE_DOWNLOADS_KEY, imageId];
    const { ok } = await kv.atomic()
        .sum(ImageDownloadsKey, count)
        .commit();
    if (!ok) throw new Error("无效的 imageId");
}

export async function getImageDownloads(imageId: string) {
    const ImageViewsKey = [ANYWHY_KV_KEY, ANYWHY_KV_IMAGE_KEY, ANYWHY_KV_IMAGE_DOWNLOADS_KEY, imageId];
    return Number(
        (await getValue<Deno.KvU64>(ImageViewsKey))?.value || 0,
    );
}

const exifInfoNameMap: (keyof ExifInfo)[] = [
    "DateTimeOriginal",
    "ExposureTime",
    "FNumber",
    "FocalLength",
    "ISOSpeedRatings",
    "Model",
    "Software",
];

export async function readImageExif(data: ArrayBuffer) {
    const { exif, file } = await ExifReader.load(data, { async: true, expanded: true });
    let needExif: ExifInfo = {}, imageSize: Size = { width: 0, height: 0 };

    if (file) imageSize = { width: file["Image Width"]?.value || 0, height: file["Image Height"]?.value || 0 };
    if (exif) {
        needExif = Object.fromEntries(
            exifInfoNameMap.map((key) => {
                return [
                    key,
                    (exif[key as keyof ExifInfo] as
                        | ExifReader.NumberTag
                        | ExifReader.StringTag)?.description,
                ];
            }),
        ) as unknown as ExifInfo;
    }

    return {
        exif: needExif,
        imageSize,
    };
}
