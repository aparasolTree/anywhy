import { JSX } from "preact";
import { useFormStatus } from "./Form.tsx";

export function Button(props: JSX.HTMLAttributes<HTMLButtonElement>) {
    const { status } = useFormStatus();
    return (
        <button
            {...props}
            disabled={status === "loading"}
            class={["disabled:opacity-50", props.class].join(" ")}
        />
    );
}
