import { ANYWHY_KV_KEY, ANYWHY_KV_NOTIFY_ID_KEY, ANYWHY_KV_NOTIFY_IMAGES_KEY } from "../constant.ts";
import { getValues, kv } from "./index.ts";

export type NotifyImagesData = { width: number; height: number; src: string };
export async function addToNotification(images: NotifyImagesData[]) {
    const NotifyImagesKey = [ANYWHY_KV_KEY, ANYWHY_KV_NOTIFY_IMAGES_KEY];
    const NotifyIdKey = [ANYWHY_KV_KEY, ANYWHY_KV_NOTIFY_ID_KEY];
    await kv.atomic()
        .set(NotifyImagesKey, images)
        .set(NotifyIdKey, crypto.randomUUID())
        .commit();
}

export async function getNotificationData() {
    const NotifyImagesKey = [ANYWHY_KV_KEY, ANYWHY_KV_NOTIFY_IMAGES_KEY];
    const NotifyIdKey = [ANYWHY_KV_KEY, ANYWHY_KV_NOTIFY_ID_KEY];
    const [images, id] = await getValues<[NotifyImagesData, string]>([NotifyImagesKey, NotifyIdKey]);
    return {
        id,
        images: images || [],
    };
}
