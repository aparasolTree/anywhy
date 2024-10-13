export function createRemoveQueue(
    timeout: number,
    callback: (id: string) => void,
) {
    const removeQueue = new Map<string, number>();
    return {
        add: (id: string) => {
            if (removeQueue.has(id)) return;
            const timeoutId = setTimeout(() => {
                callback(id);
            }, timeout);
            removeQueue.set(id, timeoutId);
        },
        clear: (id?: string) => {
            if (!id) {
                removeQueue.forEach((timeoutId) => clearTimeout(timeoutId));
                removeQueue.clear();
                return;
            }
            clearTimeout(removeQueue.get(id));
            removeQueue.delete(id);
        },
        has: (id: string) => removeQueue.has(id),
    };
}
