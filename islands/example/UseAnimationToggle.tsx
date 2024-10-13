import { useAnimationToggle } from "../../hooks/useAnimationToggle.ts";

export default function UseAnimationToggle() {
    const [{ enter, remove }, toggle] = useAnimationToggle(true, { timeout: 2000 });
    return (
        <div>
            {!remove && (
                <div
                    class={[
                        "absolute top-4 left-4",
                        "w-32 h-32 bg-orange-600 rounded-md",
                        enter ? "animate-enter" : "animate-leave",
                    ].join(" ")}
                >
                </div>
            )}
            <button
                onClick={() => toggle((s) => !s)}
                class="bg-[#333] text-white rounded-md px-3 py-1"
            >
                切换
            </button>
        </div>
    );
}
