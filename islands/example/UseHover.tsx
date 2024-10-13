import { useHover } from "../../hooks/useHover.ts";

export default function UseHover() {
    const [isHover, eventMethods] = useHover();
    return (
        <div {...eventMethods} class="text-white px-4 py-1 rounded-md bg-green-400">
            {isHover ? "Enter" : "Leave"}
        </div>
    );
}
