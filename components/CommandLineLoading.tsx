import { LoadingSVG } from "./svg/LoadingSVG.tsx";

export function CommandLineLoading({ tip }: { tip?: string }) {
    return (
        <span class="inline-flex items-center">
            <span class="animate-spin">
                <LoadingSVG />
            </span>
            <span class="ml-2">{tip}</span>
        </span>
    );
}
