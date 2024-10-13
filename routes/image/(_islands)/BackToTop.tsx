import { useEffect, useRef, useState } from "preact/hooks";
import { asset } from "fresh/runtime";
import { throttle } from "../../../utils/throttle.ts";
import { defaultWindow } from "../../../utils/constant.ts";

export function BackToTop() {
    const canBackToTop = useScrollThreshold(100);
    const backToTop = () => defaultWindow.scrollTo({ behavior: "smooth", top: 0 });
    return (
        <>
            {canBackToTop && (
                <button
                    onClick={backToTop}
                    class="fixed bottom-4 right-4 rounded-md bg-white shadow-md w-[36px] h-[36px] p-1 flex flex-col justify-between items-center"
                >
                    <img src={asset("/svg/triangle.svg")} alt="返回顶部图标" class="w-[15px] t-[15px]" />
                    <span class="text-[12px]">顶部</span>
                </button>
            )}
        </>
    );
}

function useScrollThreshold(threshold: number) {
    const isSet = useRef(false);
    const [state, setState] = useState(false);
    useEffect(() => {
        const scroll = throttle(() => {
            const scrollTop = document.documentElement.scrollTop;
            if (scrollTop >= threshold && !isSet.current) {
                setState(true);
                isSet.current = true;
            }
            if (scrollTop < threshold && isSet.current) {
                setState(false);
                isSet.current = false;
            }
        }, 200);
        document.addEventListener("scroll", scroll);
        return () => {
            document.removeEventListener("scroll", scroll);
        };
    }, [threshold]);
    return state;
}
