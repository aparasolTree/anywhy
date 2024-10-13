import { StateUpdater, useCallback, useReducer, useRef } from "preact/hooks";
import { useToggleState } from "../../hooks/useToggle.ts";
import { useMemoizeFn } from "../../hooks/useMemoizeFn.ts";
import { isFunction } from "../../utils/common.ts";

interface UsePropsValueOptions<T> {
    defaultValue: T;
    value?: T;
    onChange: (state: T) => void;
}

function usePropsValue<T>({ defaultValue, value, onChange }: UsePropsValueOptions<T>) {
    const stateRef = useRef(typeof value === "undefined" ? defaultValue : value);
    if (value !== void 0) stateRef.current = value;

    const update = useUpdate();

    const setState = useMemoizeFn((updater: StateUpdater<T>, forceTrigger: boolean = false) => {
        const newState = isFunction(updater) ? updater(stateRef.current) : updater;
        if (!forceTrigger && newState === stateRef.current) return;
        stateRef.current = newState;
        update();
        return onChange?.(newState);
    });

    return [stateRef.current, setState] as const;
}

const updateReducer = (num: number): number => num + 1;
function useUpdate() {
    const [, update] = useReducer(updateReducer, 0);
    return useCallback(() => update(0), []);
}

export function UsePropsValue() {
    const [checked, { toggle }] = useToggleState();
    return (
        <div class="flex justify-center gap-4">
            <Checked onChange={toggle} value={checked} />
            <button onClick={() => toggle()}>切换</button>
        </div>
    );
}

interface CheckedProps {
    defaultValue?: boolean;
    value?: boolean;
    onChange: (checked: boolean) => void;
}
function Checked({ onChange, value, defaultValue }: CheckedProps) {
    const [checked, setChecked] = usePropsValue({ onChange, defaultValue: defaultValue || false, value });
    return (
        <div
            onClick={() => setChecked((s) => !s)}
            class="rounded-full border-2 border-gray-400 p-2 cursor-pointer"
        >
            <div
                class={[
                    "rounded-full w-10 h-10 bg-gray-300",
                    checked ? "!bg-blue-400" : "",
                ].join(" ")}
            >
            </div>
        </div>
    );
}
