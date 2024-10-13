import { useCallback, useState } from "preact/hooks";
import { isFunction } from "../utils/common.ts";
import { defaultWindow } from "../utils/constant.ts";

function getLocalStorage<T>(name: string, initState: T): T {
    if (!defaultWindow.document) return initState;
    const value = defaultWindow.localStorage.getItem(name);
    if (value) return JSON.parse(value);
    return initState;
}

export function useLocalStorage<T>(name: string, initState: T) {
    const [state, setState] = useState(() => getLocalStorage(name, initState));
    const setStateStorage = useCallback((value: T | ((prev: T) => T)) => {
        setState((prev) => {
            const newValue = isFunction(value) ? value(prev) : value;
            const stringifyValue = JSON.stringify(newValue);
            localStorage.setItem(name, stringifyValue);
            return newValue;
        });
    }, [name]);
    return [state, setStateStorage] as const;
}
