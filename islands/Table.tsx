// deno-lint-ignore-file no-explicit-any
import { useMemo } from "preact/hooks";
import { ComponentChild, isValidElement, toChildArray, VNode } from "preact";
import { isFunction } from "../utils/common.ts";
import { FunctionComponent } from "preact";

export interface TableProps<T extends Record<string, any>> {
    data: T[];
    children: VNode | VNode[];
}

function isFunctionComponent<P>(val: unknown): val is FunctionComponent<P> {
    return isFunction(val) && "displayName" in val;
}

export function Table<T extends Record<string, any>>({ data, children }: TableProps<T>) {
    const configs = useMemo(() =>
        toChildArray(children)
            .filter((s) => isValidElement(s) && isFunctionComponent(s.type) && s.type.displayName === "TableColumn")
            .reduce((acc, val) => {
                const props = (val as VNode<TableColumnProps<T, keyof T>>).props;
                acc[props.dataKey] = props;
                return acc;
            }, {} as Record<keyof T, TableColumnProps<T, keyof T>>), [children]);

    const keys = Object.keys(configs);
    const head = keys.length ? keys : Object.keys(data[0]);
    return (
        <div class="rounded-md border-[1px] border-gray-300 bg-white inline-block overflow-auto max-w-full max-h-[49vh]">
            <table class="relative">
                <thead class="sticky top-0 left-0 right-0 bg-white shadow-sm">
                    <tr>
                        {head.map((key) => <th class="p-3 whitespace-nowrap">{configs[key]?.title || key}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {data.map((entry) => (
                        <tr class="my-2 even:bg-gray-100">
                            {head.map((key) => {
                                return (
                                    <td class="px-4 py-2">
                                        {configs[key]?.render?.(typeof entry[key] === "undefined" ? entry : entry[key]) || entry[key]}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export interface TableColumnProps<T extends Record<string, any>, K extends keyof T> {
    dataKey: K;
    title: string;
    render?: (value: any) => ComponentChild;
}

export function TableColumn<T extends Record<string, any>>(_props: TableColumnProps<T, keyof T>) {
    return null;
}

TableColumn.displayName = "TableColumn";
