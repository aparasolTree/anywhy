import { createEventLisnter } from "./toast/createEventEmit.ts";

export const checkImageEvent = createEventLisnter<(name: string) => void>();
