import { asset } from "fresh/runtime";
import { ComponentChild } from "preact";
import { useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks";
import type { AnyFuncion, ExifInfo, ImageEntry } from "../../../utils/type.ts";
import { createContextFactory } from "../../../utils/createContextFactory.ts";
import { Modal } from "../../../islands/Modal.tsx";
import { useToggleState } from "../../../hooks/useToggle.ts";
import { useMouse } from "../../../hooks/useMouse.ts";
import { useLatest } from "../../../hooks/useLatest.ts";
import { createTimeoutSignal, fetcher } from "../../../utils/fetcher.ts";
import { bytesConversion, getErrorMessage, noop } from "../../../utils/common.ts";
import { useShortcutKey } from "../../../hooks/useShortcutKey.ts";
import { useCountDown } from "../../../hooks/useCountDown.ts";
import { useLocalStorage } from "../../../hooks/useLocalStorage.ts";
import { useAnimationToggle } from "../../../hooks/useAnimationToggle.ts";
import { useUnmount } from "../../../hooks/useUnmount.ts";
import { DownloadSVG } from "../../../components/svg/Download.tsx";
import { ArrowSVG } from "../../../components/svg/ArrowSVG.tsx";
import { InfoSVG } from "../../../components/svg/InfoSVG.tsx";
import { KeySVG } from "../../../components/svg/KeySVG.tsx";
import { LoadMore } from "../../../islands/LoadMore.tsx";
import { useImageLazyLoading } from "../../../hooks/useImageLazyLoading.ts";
import { useSetRef } from "../../../hooks/useSetRef.ts";
import { toast } from "../../../utils/toast/index.ts";
import { useModal } from "../../../islands/Modal.tsx";
import { CopyButton } from "../../../islands/CopyButton.tsx";
import { ImageWaterfall } from "../../../islands/ImageWaterfall.tsx";

export interface ImagePreviewContext {
    imageEntry: ImageEntry;
    activeIndex: number;
    length: number;
    next: () => void;
    prev: () => void;
}

const [useImagePreview, ImagePreviewProvider] = createContextFactory<ImagePreviewContext>();

export interface ImagePreviewProps {
    imageEntries: ImageEntry[];
    page: number;
    limit: number;
    isAdmin?: boolean;
}

export function ImagePreview({ imageEntries, page, limit, isAdmin }: ImagePreviewProps) {
    const [imageEntriesState, setImageEntriesState] = useState(imageEntries);
    const [imageEntryIndex, setImageEntryIndex] = useState<number>(0);
    const length = useLatest(imageEntriesState.length);
    const [show, { close, open }] = useToggleState();
    const currentPage = useRef(page);

    const setActiveImage = (id: string) => setImageEntryIndex(imageEntriesState.findIndex((entry) => id === entry.id));
    const next = useCallback(() => setImageEntryIndex((index) => Math.min(index + 1, length.current - 1)), []);
    const prev = useCallback(() => setImageEntryIndex((index) => Math.max(index - 1, 0)), []);
    const observer = useImageLazyLoading();

    const add = useCallback(
        (imageEntries: ImageEntry[]) => setImageEntriesState((entries) => [...entries, ...imageEntries]),
        [],
    );

    const [ref, setRef] = useSetRef({ clear: noop, done: false, state: "idle" });
    useUnmount(() => ref.current.clear());
    const onFetchMore = async (unobserver: AnyFuncion) => {
        if (ref.current.done) return unobserver();
        if (ref.current.state === "loading") return;
        const { clear, signal } = createTimeoutSignal(10000);
        setRef({ state: "loading", clear });
        try {
            type FetchData = { imageEntries: ImageEntry[]; page: number; limit: number; done: boolean };
            const data = await fetcher<FetchData>(`/image?page=${currentPage.current += 1}&limit=${limit}`, {
                signal,
                headers: {
                    "Content-Type": "application/json",
                },
            });
            setRef({ state: "idle" });
            if (data) {
                setRef({ done: data.done });
                add(data.imageEntries);
            }
        } catch (error) {
            toast.error(getErrorMessage(error));
        }
    };

    const value = {
        prev,
        next,
        activeIndex: imageEntryIndex,
        length: imageEntriesState.length,
        imageEntry: imageEntriesState[imageEntryIndex],
    };

    return (
        <ImagePreviewProvider value={value}>
            <ImageWaterfall data={imageEntriesState}>
                {(imageEntry) => (
                    <Image
                        key={imageEntry.id}
                        observer={observer}
                        imageEntry={imageEntry}
                        onClick={() => {
                            open();
                            setActiveImage(imageEntry.id);
                        }}
                    />
                )}
            </ImageWaterfall>
            {value.imageEntry && (
                <Modal show={show} onClose={close}>
                    <Preview isAdmin={isAdmin} />
                </Modal>
            )}
            <LoadMore onFetchMore={onFetchMore} loaded={ref.current.done} />
        </ImagePreviewProvider>
    );
}

function Preview({ isAdmin }: { isAdmin?: boolean }) {
    const { imageEntry, activeIndex, length } = useImagePreview();
    const { height, width, name, exif, id, views, size, downloads } = imageEntry;
    useEffect(() => {
        fetcher(`/image/views/${id}`, {
            signal: AbortSignal.timeout(3000),
        }).catch((error) => toast.error(getErrorMessage(error)));
    }, [id]);
    return (
        <div class="mt-4 w-[1000px] bg-white p-6 rounded-lg relative">
            <div class="absolute bottom-0 left-[105%] flex flex-col items-start gap-2">
                <ShortcutKeyTip />
                <ImageDownload name={name} downloads={downloads} />
            </div>
            <ImageSize size={size} width={width} height={height} />
            <ImageExif exif={exif || {}} />
            <div class="mb-4 flex justify-between">
                {isAdmin ? <CopyButton text={name} content={name} className="hover:underline" /> : <h3>{name}</h3>}
                <ImageViews views={views || 0} />
            </div>
            <ImagePreviewWrapper width={width} height={height} name={name} />
            <SwitchImage type="next" allow={activeIndex < length - 1} />
            <SwitchImage type="prev" allow={activeIndex > 0} />
        </div>
    );
}

const shortcutKeys = {
    "d": "下载图片",
    "k": "快捷键提示",
    "e": "图片元信息",
    "->": "切换下一个图片",
    "<-": "切换上一个图片",
    "Esc": "退出当前图片预览",
};

function Code({ code }: { code: string }) {
    return (
        <span class="bg-[#333] rounded-md px-3 py-1 text-white">
            {code}
        </span>
    );
}

function ShortcutKeyTip() {
    const [isPrompts, setIsPrompts] = useLocalStorage("shortcutKeyTip", true);
    const [{ enter, remove }, toggle] = useAnimationToggle(isPrompts, { timeout: 200 });
    const { atTop } = useModal();
    useShortcutKey("k", () => atTop && toggle((s) => !s));
    return (
        <button class="p-[6px] rounded-md bg-white" onClick={() => toggle((s) => !s)}>
            <span class="text-[20px] text-[#333]">
                <KeySVG />
            </span>
            {!remove && (
                <ShortcutKeyInfo
                    isPrompts={isPrompts}
                    enter={enter}
                    setPrompts={setIsPrompts}
                    onClose={() => toggle(false)}
                />
            )}
        </button>
    );
}

interface ShortcutKeyInfoProps {
    isPrompts: boolean;
    enter: boolean;
    setPrompts: (isTip: boolean) => void;
    onClose: () => void;
}
function ShortcutKeyInfo({ isPrompts, enter, setPrompts, onClose }: ShortcutKeyInfoProps) {
    return (
        <div
            onClick={(e) => e.stopPropagation()}
            class={[
                "fixed top-[50px] left-8 z-[2000]",
                enter ? "animate-drawer-left-enter" : "animate-drawer-left-leave",
            ].join(" ")}
        >
            {isPrompts && (
                <div class="flex gap-2 mb-3">
                    <NoAutoPrompts isPrompts={isPrompts} noPrompts={(checked) => setPrompts(!checked)} />
                    <CountDown onClose={onClose} />
                </div>
            )}
            <h3 class="mb-2 text-start">
                <span class="bg-white rounded-md px-3 py-1 shadow-md">快捷键提示</span>
            </h3>
            <div class="bg-white rounded-md p-3 shadow-md min-w-56">
                <div class="flex flex-col gap-2 items-start mb-3">
                    {Object.entries(shortcutKeys).map(([key, info]) => {
                        return (
                            <div>
                                <Code code={key} />： {info}
                            </div>
                        );
                    })}
                </div>
                <div class="text-end">
                    <button class="px-3 rounded-md bg-yellow-400 text-white" onClick={onClose}>
                        关闭
                    </button>
                </div>
            </div>
        </div>
    );
}

function CountDown({ onClose }: { onClose: () => void }) {
    const [count, { start }] = useCountDown(10);
    const onCloseRef = useLatest(onClose);

    useEffect(() => {
        start(() => {
            onCloseRef.current();
        });
    }, [start]);

    return (
        <div class="flex justify-between gap-3 bg-white rounded-md px-3 py-1 shadow-md">
            <div class="w-4 text-center">{count}</div>
            秒后自动关闭
        </div>
    );
}

function NoAutoPrompts({ isPrompts, noPrompts }: { isPrompts: boolean; noPrompts: (checked: boolean) => void }) {
    const input = (e: InputEvent) => noPrompts((e.target as HTMLInputElement).checked);
    return (
        <label htmlFor="tip" class="bg-white rounded-md px-3 py-1 shadow-md">
            <input
                id="tip"
                type="checkbox"
                onInput={input}
                defaultChecked={!isPrompts}
            />
            不再自动提示
        </label>
    );
}

function ImageSize({ size, width, height }: { size: number; width: number; height: number }) {
    const data = [["大小", bytesConversion(size)], ["尺寸", `${width} x ${height}`]];
    return (
        <div class="absolute bottom-0 right-[105%] flex flex-col items-end gap-3">
            {data.map(([name, val]) => (
                <div class="bg-white px-3 py-1 rounded-md whitespace-nowrap">
                    <span class="mr-2">{name}</span>
                    <span>{val}</span>
                </div>
            ))}
        </div>
    );
}

function ImageDownload(props: { name: string; downloads?: number }) {
    const { name, downloads = 0 } = props;
    const linkRef = useRef<HTMLAnchorElement>(null);
    const { atTop } = useModal();
    useShortcutKey("d", () => atTop && linkRef.current?.click());
    return (
        <a
            title="下载图片 <d>"
            ref={linkRef}
            href={`/image/${name}?action=downloads`}
            class="px-[6px] py-[3px] rounded-md bg-white flex items-center gap-2"
        >
            <span class="text-[#1C274C] text-[20px]">
                <DownloadSVG />
            </span>
            <span>{downloads}</span>
        </a>
    );
}

function ImageViews({ views }: { views: number }) {
    return (
        <div class="px-3 py-1 rounded-md bg-green-500 text-white">
            <span class="mr-2">浏览量</span>
            <span>{views}</span>
        </div>
    );
}

const exifInfoNameMap: Partial<Record<keyof ExifInfo, string>> = {
    DateTimeOriginal: "创建时间",
    ExposureTime: "快门",
    FNumber: "光圈",
    FocalLength: "焦距",
    ISOSpeedRatings: "ISO",
    Model: "相机型号",
    Software: "软件",
};

interface ImageExifProps {
    exif: ExifInfo;
}
function ImageExif({ exif }: ImageExifProps) {
    const hasExifInfo = !!Object.keys(exif).length;
    const [show, { toggle, open, close }] = useToggleState(false);
    useShortcutKey("e", () => toggle());
    return (
        <button
            onClick={() => hasExifInfo && open()}
            title={!hasExifInfo ? "当前图片不存在元信息" : ""}
            class={[
                "bg-white rounded-md absolute top-0 left-[105%] p-[6px]",
                hasExifInfo ? "" : "bg-opacity-50 cursor-not-allowed",
            ].join(" ")}
        >
            <span class="text-[#1C274C] text-[20px]">
                <InfoSVG />
            </span>
            <Modal show={show} onClose={close} class="w-[600px] bg-white rounded-md p-4">
                <h3 class="text-[26px] my-4">图片元信息</h3>
                <div class="grid grid-cols-4 gap-2">
                    {Object.entries(exifInfoNameMap).map(([key, val]) => {
                        const value = exif[key as keyof ExifInfo];
                        if (!value) return null;
                        return (
                            <div class="flex flex-col gap-1 items-center">
                                <p class="text-[18px]">{val}</p>
                                <p class="truncate w-full" title={`${value}`}>{value}</p>
                            </div>
                        );
                    }).filter(Boolean)}
                </div>
            </Modal>
        </button>
    );
}

interface SwitchImage {
    type: "next" | "prev";
    allow: boolean;
}
function SwitchImage({ type, allow }: SwitchImage) {
    const { next, prev } = useImagePreview();
    const methods = { next, prev };
    const { atTop } = useModal();
    useShortcutKey(type == "next" ? "ArrowRight" : "ArrowLeft", () => atTop && methods[type]());
    return (
        <button
            disabled={!allow}
            title={`图片切换 <${type === "next" ? "->" : "<-"}>`}
            onClick={methods[type]}
            class={[
                "bg-white rounded-full shadow-md",
                "p-1 text-[#0F0F0F] text-[30px]",
                "absolute top-1/2 -translate-y-1/2",
                "disabled:cursor-not-allowed disabled:opacity-50",
                type === "prev" ? "right-[110%]" : "-scale-x-100 left-[110%]",
            ].join(" ")}
        >
            <ArrowSVG />
        </button>
    );
}

interface ImageScalingCheckWrapperProps {
    height: number;
    width: number;
    name: string;
}

const H = 300;
function ImagePreviewWrapper({ height, width, name }: ImageScalingCheckWrapperProps) {
    const W = (width / height) * H;
    return (
        <div class="overflow-hidden">
            <div
                class="relative mx-auto"
                style={{ minWidth: W, maxWidth: `${(W / H) * 75}vh`, minHeight: H, maxHeight: "75vh" }}
            >
                <ImageScalingCheck
                    height={height}
                    width={width}
                    src={`/image/${name}`}
                />
            </div>
        </div>
    );
}

interface ImageProps {
    imageEntry: ImageEntry;
    observer: (target: Element, src: string) => void;
    onClick: () => void;
}
function Image({ imageEntry, observer, onClick }: ImageProps) {
    const { width, height, name } = imageEntry;
    const ref = useRef<HTMLImageElement>(null);
    useEffect(() => {
        if (ref.current) {
            return observer(ref.current, asset("/image/" + name));
        }
    }, [observer, name]);
    return (
        <div
            onClick={onClick}
            style={{ paddingBottom: `${height / width * 100}%` }}
            class="rounded-md overflow-hidden relative bg-slate-100"
        >
            <img
                ref={ref}
                loading="lazy"
                alt="个人图像作品"
                src={asset("/duck.png")}
                class="absolute right-0 left-0 top-0 bottom-0 w-full"
            />
        </div>
    );
}

interface ImageScalingCheckProps {
    src: string;
    width: number;
    height: number;
}
function ImageScalingCheck({ src, height, width }: ImageScalingCheckProps) {
    const [isClick, { toggle }] = useToggleState(false);
    const [{ x, y }, { start, cancel }] = useMouse(false, { percentage: true });

    useEffect(() => {
        isClick ? start() : cancel();
    }, [isClick, start, cancel]);

    return (
        <div class="relative" style={{ paddingBottom: `${(height / width) * 100}%` }}>
            <img
                src={src}
                width={width}
                height={height}
                onClick={() => toggle()}
                alt="图片可进行缩放查看部分细节"
                class="w-full h-full absolute left-0 right-0 top-0 bottom-0 block"
                style={{
                    cursor: isClick ? "zoom-out" : "zoom-in",
                    transformOrigin: "center",
                    transition: "transform 0.1s ease",
                    transform: isClick
                        ? `scale(2) translate(
                            calc(clamp(-50%, ${-(x - 50)}%, 50%)),
                            calc(clamp(-50%, ${-(y - 50)}%, 50%))
                        )`
                        : "",
                }}
            />
        </div>
    );
}
