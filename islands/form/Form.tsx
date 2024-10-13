import { useState } from "preact/hooks";
import { JSX } from "preact/jsx-runtime";
import { createContextFactory } from "../../utils/createContextFactory.ts";
import { toast } from "../../utils/toast/index.ts";

export interface FormContextProps {
    status: FormStatus;
}

const [useFormStatus, FormProvider] = createContextFactory<FormContextProps>();
const formMethodAllowed: FormMethod[] = ["get", "post"];

export type FormStatus = "idle" | "loading";
export type FormMethod = "get" | "post";
export type FormSubmit<T> = (action: string, method: FormMethod, formData: FormData) => T | Promise<T>;
export interface FormProps<T> extends Omit<JSX.HTMLAttributes<HTMLFormElement>, "onSubmit" | "method" | "action"> {
    action: string;
    method: FormMethod;
    onSubmit?: FormSubmit<T>;
}
export function Form<T>({ onSubmit, ...props }: FormProps<T>) {
    const [formStatus, setFormStatus] = useState<FormStatus>("idle");
    const submit = async (event: SubmitEvent) => {
        event.preventDefault();
        const formElement = event.currentTarget as HTMLFormElement;
        if (formElement.tagName === "FORM") {
            const action = formElement.getAttribute("action")!;
            const method = formElement.getAttribute("method")!;
            if (!formMethodAllowed.includes(method as FormMethod)) toast.error("当前form method=" + method + " 不支持");
            const formData = new FormData(formElement);
            try {
                setFormStatus("loading");
                await onSubmit?.(action, method as FormMethod, formData);
                setFormStatus("idle");
            } catch (error) {
                console.log(error);
            }
        }
    };

    return (
        <FormProvider value={{ status: formStatus }}>
            <form {...props} onSubmit={submit}></form>
        </FormProvider>
    );
}

export { useFormStatus };
