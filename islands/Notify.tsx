import { useEffect } from "preact/hooks";
import { NotifySVG } from "../components/svg/NotifySVG.tsx";
import { useToggleState } from "../hooks/useToggle.ts";
import { Modal } from "./Modal.tsx";
import { useLocalStorage } from "../hooks/useLocalStorage.ts";
import { fetcher } from "../utils/fetcher.ts";
import { AnyFuncion } from "../utils/type.ts";
import { NotifyImagesData } from "../utils/kv/notify.ts";
import { ImageWaterfall } from "./ImageWaterfall.tsx";

export function Notify() {
    const [{ images, id }, setState] = useLocalStorage<{ images: NotifyImagesData[]; id?: string }>("latest-upload-images", { images: [] });
    const [viewed, setViewed] = useLocalStorage<boolean>("viewed", true);
    const [show, { close, open }] = useToggleState();
    useEffect(() => {
        fetcher<null | { images: NotifyImagesData[]; id?: string }>("/notify?id=" + (id || ""))
            .then((data) => {
                if (data) {
                    setState(data);
                    setViewed(false);
                }
            });
    }, [id]);
    return (
        <div>
            <button onClick={open} class="relative p-2 bg-white rounded-full text-xl shadow-md" title="通知">
                <NotifySVG />
                {images.length && !viewed
                    ? (
                        <span class="absolute -top-1 -right-1 rounded-full text-[10px] bg-red-500 text-white w-4 h-4 flex items-center justify-center">
                            {images.length}
                        </span>
                    )
                    : null}
            </button>
            <Modal show={show && !!images.length} onClose={close} class="bg-white p-6 rounded-md">
                <h2 class="text-center text-xl">最近一次上传的图片</h2>
                <LatestUploadImages images={images} onOpen={() => setViewed(true)} />
            </Modal>
        </div>
    );
}

function LatestUploadImages({ images, onOpen }: { images: NotifyImagesData[]; onOpen: AnyFuncion }) {
    useEffect(() => {
        onOpen();
    }, []);
    return (
        <div class="w-[900px] mt-4 max-h-[60vh] overflow-auto">
            <ImageWaterfall data={images} cols={5}>
                {({ src }) => {
                    return <img src={src} alt="" class="w-full rounded-md shadow-sm" />;
                }}
            </ImageWaterfall>
        </div>
    );
}
