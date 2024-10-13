import { ToastConfigProvider } from "./context.ts";
import { Toast } from "../../utils/type.ts";
import { ToastContainer } from "./ToastContainer.tsx";

export interface ToasterProps {
    enterAnimate?: string;
    leaveAnimate?: string;
    timeout?: number;
    gap?: number;
    position?: Toast["position"];
}

export default function Toaster(props: ToasterProps = {}) {
    return (
        <ToastConfigProvider value={props}>
            <ToastContainer />
        </ToastConfigProvider>
    );
}
