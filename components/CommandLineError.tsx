import { ErrorIcon } from "./toast/ErrorIcon.tsx";

export function CommandLineError({ errorMessage }: { errorMessage?: string }) {
    return (
        <div class="text-red-500 flex gap-1 items-center">
            <ErrorIcon />
            <span class="ml-2">{errorMessage}</span>
        </div>
    );
}
