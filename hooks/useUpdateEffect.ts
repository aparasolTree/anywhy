import { EffectCallback, Inputs, useEffect, useRef } from "preact/hooks";

export function useUpdateEffect(effect: EffectCallback, inputs?: Inputs) {
    const isFirstMount = useRef(true);
    useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false;
            return;
        }
        return effect();
    }, inputs);
}
