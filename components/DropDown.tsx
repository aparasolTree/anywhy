import type { ComponentChild } from "preact";
import { toChildArray } from "preact";

export interface DropDownProps {
    children?: ComponentChild;
}
export function DropDown({ children }: DropDownProps) {
    return (
        <div class="group relative">
            {children}
        </div>
    );
}

export interface DropDownContentProps {
    children: ComponentChild[] | ComponentChild;
}
export function DropDownContent({ children }: DropDownContentProps) {
    return (
        <div class="group-hover:block group-hover:animate-enter hidden absolute top-full right-0 pt-3">
            <ul class="px-5 py-2 bg-white rounded-md shadow-md">
                {toChildArray(children).map((child) => {
                    return <li class="my-2">{child}</li>;
                })}
            </ul>
        </div>
    );
}
