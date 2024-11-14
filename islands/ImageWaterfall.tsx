import { ComponentChild } from "preact";
import { useMemo } from "preact/hooks";

interface ImageWaterfallProps<T> {
    data: T[];
    children: (val: T) => ComponentChild;
    cols?: number;
}

export function ImageWaterfall<T extends Size>({ data, cols, children }: ImageWaterfallProps<T>) {
    const waterfall = useMemo(() => calcWaterfallPosition<T>(data, cols), [data, cols]);
    return (
        <div class="flex gap-4">
            {waterfall.map((col) => {
                return (
                    <div class="flex flex-1 flex-col gap-4">
                        {col.map((item) => children(item))}
                    </div>
                );
            })}
        </div>
    );
}

const getMinValueIndex = (arr: number[]) => arr.reduce((acc, val, index) => arr[acc] > val ? index : acc, 0);

type Size = { height: number; width: number };
const calcHeight = ({ width, height }: Size, W: number = 300) => (height / width) * W;

function calcWaterfallPosition<T extends Size>(entries: T[], rows: number = 3): T[][] {
    if (entries.length === 0) return [];

    const entryList: T[][] = Array.from({ length: rows }, () => []);
    for (let i = 0; i < Math.min(rows, entries.length); i++) {
        entryList[i].push(entries[i]);
    }

    const colHeightList = entryList.map((row) => row.reduce((sum, entry) => sum + calcHeight(entry), 0));
    for (let i = rows; i < entries.length; i++) {
        const minHeightIndex = getMinValueIndex(colHeightList);
        entryList[minHeightIndex].push(entries[i]);
        colHeightList[minHeightIndex] += calcHeight(entries[i]);
    }

    return entryList;
}
