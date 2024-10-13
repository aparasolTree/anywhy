export function WarnnningIcon() {
    return (
        <div class="w-[20px] h-[20px] bg-yellow-500 rounded-full relative opacity-0 scale-[0.6] animate-circle-warnning">
            <div class="absolute w-[2px] h-[12px] left-[9px] top-[4px] animate-warnning origin-top">
                <div class="absolute w-[2px] h-[8px] bg-white top-0"></div>
                <div class="absolute w-[2px] h-[2px] bg-white bottom-0"></div>
            </div>
        </div>
    );
}
