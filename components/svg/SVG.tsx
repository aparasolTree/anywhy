import { JSX } from "preact";

export function SVG({ viewBox = "0 0 24 24", ...props }: JSX.SVGAttributes<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox={viewBox}
            width="1em"
            height="1em"
            {...props}
        />
    );
}
