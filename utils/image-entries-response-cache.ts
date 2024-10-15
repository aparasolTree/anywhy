import { ImageEntry } from "./type.ts";

let imageEntriesResponseCache: ImageEntry[] | null = null;

export function setImageEntriesResponseCache(imageEntries: ImageEntry[]) {
    imageEntriesResponseCache = imageEntries;
    return imageEntries;
}

export function getImageEntriesResponseCache() {
    return imageEntriesResponseCache;
}
