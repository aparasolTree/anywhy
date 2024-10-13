// deno-lint-ignore no-explicit-any
export function createEventLisnter<T extends (...args: any) => any>() {
    const events = new Set<T>();
    return {
        add(callback: T) {
            events.add(callback);
            return () => {
                events.delete(callback);
            };
        },
        dispatch(...args: Parameters<T>) {
            events.forEach((fn) => fn.apply(null, args));
        },
    };
}
