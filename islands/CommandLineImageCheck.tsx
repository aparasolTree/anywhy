import { checkImageEvent } from "../utils/commandLineEvent.ts";

export function CommandLineImageCheck({ name }: { name: string }) {
    return (
        <span
            onMouseEnter={() => checkImageEvent.dispatch(name)}
            onMouseLeave={() => checkImageEvent.dispatch("")}
            class="hover:underline cursor-pointer"
        >
            {name}
        </span>
    );
}
