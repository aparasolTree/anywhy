import { SVG } from "./SVG.tsx";

export function DownloadSVG() {
    return (
        <SVG>
            <path
                d="M12 7L12 14M12 14L15 11M12 14L9 11"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
            <path d="M16 17H12H8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            <path
                d="M22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C21.5093 4.43821 21.8356 5.80655 21.9449 8"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
            />
        </SVG>
    );
}