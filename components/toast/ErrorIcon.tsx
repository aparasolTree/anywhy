export function ErrorIcon() {
    return (
        <div class="w-[20px] h-[20px] bg-red-500 relative rounded-full opacity-0 scale-[0.6] -rotate-45 animate-circle">
            <div class="w-[2px] h-[12px] bg-white absolute right-[9px] top-[4px] rounded-sm animate-error-one-line" />
            <div class="w-[2px] h-[12px] bg-white absolute right-[9px] top-[4px] rounded-sm rotate-90 animate-error-two-line" />
        </div>
    );
}
