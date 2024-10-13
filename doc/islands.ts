import { App } from "fresh";
import { walk } from "@std/fs/walk";
import { ComponentType } from "preact";
import { join } from "@std/path";

const IS_LAND = /^_island/;
export const ExampleComponents = {} as Record<string, ComponentType>;
export async function addIslands<State>(app: App<State>) {
    const walkIter = walk("./", { includeDirs: false, exts: [".tsx"] });
    for await (const { name, path } of walkIter) {
        if (!IS_LAND.test(name)) continue;
        const filePath = new URL(join("..", path), import.meta.url);
        const map = await import(filePath.toString());
        for (const key of Object.keys(map)) {
            app.island(filePath, key, map[key]);
            ExampleComponents[key] = map[key];
        }
    }
}
