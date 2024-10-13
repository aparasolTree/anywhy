import { createEventLisnter } from "./toast/createEventEmit.ts";

export type CommandDisplayPanel = "commandLine" | "upload";
export const togglePanelEvent = createEventLisnter<(val: CommandDisplayPanel) => void>();

export const checkImageEvent = createEventLisnter<(name: string) => void>();
