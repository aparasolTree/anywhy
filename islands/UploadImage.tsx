import { useCallback, useState } from "preact/hooks";
import { toast } from "../utils/toast/index.ts";
import { bytesConversion, noop } from "../utils/common.ts";
import { Form } from "./form/Form.tsx";
import { Button } from "./form/Button.tsx";
import { useFormState } from "../utils/useFormSubmit.ts";
import { fetcher } from "../utils/fetcher.ts";
import { useMemoizeFn } from "../hooks/useMemoizeFn.ts";
import { asset } from "fresh/runtime";
import { DeleteSVG } from "../components/svg/DeleteSVG.tsx";
import { AnyFuncion, Size } from "../utils/type.ts";
import { useHover } from "../hooks/useHover.ts";
import { createContextFactory } from "../utils/createContextFactory.ts";
import { usePromise } from "../hooks/usePromise.ts";

function onFilterError(error: FileError) {
    let errorMessage: string = "";
    switch (error.type) {
        case "filter":
            errorMessage = "文件的扩展名不支持：" + error.file.name;
            break;
        case "repeat":
            errorMessage = "文件名不能重复：" + error.file.name;
            break;
        case "size":
            errorMessage = "上传的文件数量不能大于：" + error.size;
            break;
        default:
            break;
    }

    errorMessage && toast.error(errorMessage);
}

const ImageAllowedExtname = ["jpeg", "jpg", "png"];
const MAX_LENGTH = 10;

const [useFormContext, FormProvider] = createContextFactory<{
    setActiveIndex: (index: number) => void;
}>();

export function UploadImage() {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isHover, hoverMethods] = useHover<HTMLDivElement>();
    const [fileList, { onInput, remove, setFileList, clear }] = useFileList({
        size: MAX_LENGTH,
        onError: onFilterError,
        filter: (file) => {
            return ImageAllowedExtname.includes(file.name.split(".").pop() || "");
        },
    });
    const [isEnter, methods] = useFileDrop((images) => setFileList(images), { dropEffect: "move" });
    const [_, submit] = useFormState(void 0, async (action, method) => {
        const formData = new FormData();
        fileList.forEach((file) => formData.append("images", file));
        await fetcher(action, {
            method,
            body: method === "post" ? formData : "",
        });
        clear();
    });

    return (
        <Form
            onSubmit={submit}
            method="post"
            action="/admin/upload"
            enctype="multipart/form-data"
            class="w-full h-[75vh]"
        >
            <FormProvider value={{ setActiveIndex }}>
                <div class="flex justify-between mb-6">
                    <h2 class="bg-white rounded-md px-4 py-1">
                        图片上传
                    </h2>
                    <Button class="bg-green-500 px-4 py-1 rounded-md text-white">
                        上传
                    </Button>
                </div>
                <div class="flex gap-6 w-full h-full">
                    <FileListBox fileList={fileList} remove={remove} {...hoverMethods} />
                    <fieldset class="bg-white flex-1 relative border-[3px] border-dashed rounded-xl overflow-hidden">
                        {fileList[activeIndex] &&
                            isHover &&
                            <UploadImagePreview file={fileList[activeIndex]} />}
                        <label
                            {...methods}
                            htmlFor="file"
                            title="拖拽或点击上传"
                            class={[
                                "relative",
                                "flex flex-col justify-center items-center gap-6",
                                "h-full w-full",
                                "cursor-pointer",
                                isEnter ? "border-green-500" : "",
                            ].join(" ")}
                        >
                            <span class="absolute top-2 right-2 text-gray-200">{fileList.length} / {MAX_LENGTH}</span>
                            <img src="/svg/upload.svg" alt="upload images" class="w-[50px]" />
                            <p class="text-[30px] text-[#aaa]">图片上传</p>
                        </label>
                        <input
                            multiple
                            type="file"
                            max={10}
                            class="hidden"
                            id="file"
                            name="images"
                            accept=".png,.jpeg,.jpg"
                            onInput={onInput}
                        />
                    </fieldset>
                </div>
            </FormProvider>
        </Form>
    );
}

const H = 300;
function UploadImagePreview({ file }: { file: File }) {
    const { data: dataURL } = usePromise(() => readFileToDataURL(file), [file]);
    if (!dataURL) return null;
    const { data: size } = usePromise(() => getImageRatio(dataURL), [dataURL]);
    if (!size) return null;
    const W = (size.width / size.height) * H;
    return (
        <div class="absolute left-0 right-0 top-0 bottom-0 bg-white z-50 flex justify-center items-center">
            <div style={{ minWidth: W, maxWidth: `${(W / H) * 75}vh`, minHeight: H, maxHeight: "75vh" }}>
                <img src={dataURL} alt="" loading="lazy" class="w-full h-full" />
            </div>
        </div>
    );
}

function getImageRatio(src: string) {
    const img = new Image();
    return new Promise<Size>((resolve, reject) => {
        img.src = src;
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = reject;
    });
}

interface FileListBoxProps {
    fileList: File[];
    remove: (index: number) => void;
    onMouseEnter?: AnyFuncion;
    onMouseLeave?: AnyFuncion;
}
function FileListBox({ fileList, remove, ...methods }: FileListBoxProps) {
    return (
        <div class="bg-white rounded-md shadow-md h-full w-[300px] p-4">
            <h2 class="text-2xl text-center">图片上传预览</h2>
            {!fileList.length
                ? (
                    <div class="flex flex-col gap-4 justify-center items-center h-full">
                        <img src={asset("/svg/empty.svg")} alt="" class="w-44 object-cover" />
                        <p class="text-lg text-gray-500">图片上传列表为空</p>
                    </div>
                )
                : (
                    <div {...methods}>
                        <FilePreview fileList={fileList} remove={remove} />
                    </div>
                )}
        </div>
    );
}

type FileError =
    | { file: File; type: "repeat" | "filter" }
    | { type: "size"; size: number };

interface UseFileListOptions {
    size?: number;
    filter?: (file: File) => boolean;
    onError?: (error: FileError) => void;
}

function useFileList({
    onError = noop,
    size = Infinity,
    filter = () => true,
}: UseFileListOptions = {}) {
    const [fileList, setFileList] = useState<File[]>([]);

    const clear = useCallback(() => setFileList([]), []);
    const newSetFileList = useMemoizeFn((files: File[]) => {
        if (fileList.length + files.length > size) return onError({ type: "size", size });
        const filterErrorFile = files.find((file) => !filter(file));
        if (filterErrorFile) return onError({ file: filterErrorFile, type: "filter" });
        setFileList((prevFileList) => {
            const names = prevFileList.map(({ name }) => name);
            const index = files.findIndex(({ name }) => names.includes(name));
            if (index > -1) {
                onError({ file: files[index], type: "repeat" });
                return prevFileList;
            }
            return [...prevFileList, ...files];
        });
    });

    const onInput = useCallback(({ currentTarget }: InputEvent) => {
        const element = currentTarget as HTMLInputElement;
        const files = element.files;
        if (element.tagName === "INPUT" && files) {
            newSetFileList([...files]);
        }
    }, [newSetFileList]);

    const remove = useCallback(
        (index: number) =>
            setFileList((fileList) => {
                return fileList.filter((_, i) => i !== index);
            }),
        [],
    );

    return [
        fileList,
        { onInput, remove, clear, setFileList: newSetFileList },
    ] as const;
}

interface FileItemProps {
    file: File;
    removeFile: AnyFuncion;
    onMouseEnter: AnyFuncion;
}

function FileItem({ file, removeFile, onMouseEnter }: FileItemProps) {
    return (
        <li
            onMouseEnter={onMouseEnter}
            class="flex justify-between items-center group px-2 py-1 my-2 hover:bg-gray-50 rounded-md"
        >
            <div class="text-[12px]">
                <h4 class="group-hover:text-green-500">{file.name}</h4>
                <div class="mt-1 text-gray-300">
                    大小：{bytesConversion(file.size)}
                </div>
            </div>
            <button
                onClick={removeFile}
                class="text-[14px] text-red-400 hover:text-red-600 cursor-pointer"
            >
                <DeleteSVG />
            </button>
        </li>
    );
}

interface FilePreviewProps {
    fileList: File[];
    remove: (index: number) => void;
}
function FilePreview({ fileList, remove }: FilePreviewProps) {
    const { setActiveIndex } = useFormContext();
    return (
        <div class="my-2 relative">
            <ul class="max-h-[300px] overflow-y-auto">
                {fileList.map((file, index) => {
                    return (
                        <FileItem
                            key={file.name}
                            file={file}
                            removeFile={() => remove(index)}
                            onMouseEnter={() => setActiveIndex(index)}
                        />
                    );
                })}
            </ul>
        </div>
    );
}

const fileCache = new WeakMap<File, string>();
function readFileToDataURL(file: File) {
    if (!file) return "";
    if (fileCache.has(file)) return fileCache.get(file);
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onerror = () => reject(reader.error);
        reader.onloadend = () => {
            const res = reader.result as string;
            fileCache.set(file, res);
            resolve(res);
        };
    });
}

export interface UseFileDropProps {
    dropEffect?: DataTransfer["dropEffect"];
    enterClassName?: string;
}

function useFileDrop(callback: (data: File[]) => void, { dropEffect }: UseFileDropProps) {
    const [isEnter, setIsEnter] = useState(false);
    const onDragEnter = () => setIsEnter(true);
    const onDragLeave = () => setIsEnter(false);
    const onDragOver = (event: DragEvent) => {
        event.preventDefault();
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = dropEffect || "none";
        }
    };

    return [isEnter, {
        onDragEnter,
        onDragLeave,
        onDragOver,
        onDrop: (event: DragEvent) => {
            event.preventDefault();
            setIsEnter(false);
            if (event.dataTransfer) {
                const files = [...event.dataTransfer.files];
                if (files.length > 0) {
                    callback(files);
                }
            }
        },
    }] as const;
}
