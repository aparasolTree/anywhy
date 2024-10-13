import { useCallback, useState } from "preact/hooks";
import { FormSubmit } from "../islands/form/Form.tsx";
import { useMemoizeFn } from "../hooks/useMemoizeFn.ts";

type State<T> = T | (() => T);
export function useFormState<T>(initState: State<T>, submit: FormSubmit<T>) {
    const [error, setError] = useState<string>("");
    const [formState, setFormState] = useState(initState);
    const cachedSubmitFn = useMemoizeFn(submit);

    const newSubmit = useCallback(async (...props: Parameters<FormSubmit<T>>) => {
        try {
            setError("");
            const data = await cachedSubmitFn(...props);
            if (data) {
                setFormState(data);
            }
        } catch (error) {
            setError(error?.message || "");
        }
    }, [cachedSubmitFn]);

    return [
        formState,
        newSubmit,
        error,
    ] as const;
}
