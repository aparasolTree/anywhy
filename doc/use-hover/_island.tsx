import { useMemo, useState } from "preact/hooks";

function useHover(initState: boolean = false) {
    const [isHover, setIsHover] = useState(initState);
    const eventMethods = useMemo(() => {
        return {
            onMouseEnter: () => setIsHover(true),
            onMouseLeave: () => setIsHover(false),
        };
    }, []);

    return [isHover, eventMethods] as const;
}

export function UseHover() {
    const [isHover, eventMethods] = useHover();
    return (
        <div {...eventMethods} class="text-white px-4 py-1 rounded-md bg-green-400">
            {isHover ? "Enter" : "Leave"}
        </div>
    );
}
