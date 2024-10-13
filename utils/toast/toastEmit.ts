import { ToastAction } from "../type.ts";
import { createEventLisnter } from "./createEventEmit.ts";

export const toastEmit = createEventLisnter<(payload: ToastAction) => void>();
