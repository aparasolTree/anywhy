import { ToasterProps } from "./index.tsx";
import { createContextFactory } from "../../utils/createContextFactory.ts";

const [useToastConfig, ToastConfigProvider] = createContextFactory<
    ToasterProps
>();

export { ToastConfigProvider, useToastConfig };
