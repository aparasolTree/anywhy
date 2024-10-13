import { SVG } from "./SVG.tsx";

export function DeleteSVG() {
    return (
        <SVG fill="none" stroke="currentColor">
            <path
                d="M10 11V17"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
            </path>{" "}
            <path
                d="M14 11V17"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
            </path>{" "}
            <path d="M4 7H20" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            </path>{" "}
            <path
                d="M6 7H12H18V18C18 19.6569 16.6569 21 15 21H9C7.34315 21 6 19.6569 6 18V7Z"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
            </path>{" "}
            <path
                d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V7H9V5Z"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
            </path>
        </SVG>
    );
}
