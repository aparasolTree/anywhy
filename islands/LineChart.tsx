import { Dispatch, StateUpdater, useMemo, useState } from "preact/hooks";
import { useHover } from "../hooks/useHover.ts";
import { useElementRectCallback } from "../hooks/useElementRect.ts";
import { createContextFactory } from "../utils/createContextFactory.ts";
import { ComponentChild } from "preact";

export interface ChartProps {
    width?: number;
    height?: number;
    data: Record<string, unknown>[];
    padding?: number;
    children?: ComponentChild;
}

interface ChartContextProps<T> {
    padding: number;
    bottom: number;
    width: number;
    height: number;
    data: Record<string, T>[];
    activeCircleIndex: number;

    isHover: boolean;

    offsetX: number;
    offsetY: number;

    setTipToolSize: Dispatch<StateUpdater<{ width: number; height: number }>>;
}

const [useChartContext, ChartProvider] = createContextFactory<
    // deno-lint-ignore no-explicit-any
    ChartContextProps<any>
>();

export function Chart(
    { data, width = 200, height = 100, padding = 10, children }: ChartProps,
) {
    const hoverRange = useMemo(
        () => {
            let x = padding;
            const scale = new Array(data.length);
            const XAxisHalfGap = ((width - padding * 2) / (data.length - 1)) /
                2;
            for (let i = 0; i < data.length; i++) {
                scale[i] = [x - XAxisHalfGap, x + XAxisHalfGap];
                x += (width - padding * 2) / (data.length - 1);
            }
            return scale;
        },
        [data, padding],
    );

    const [isHover, hoverEleRef] = useHover<HTMLDivElement>();
    const [{ width: tipToolWidth, height: tipToolHeight }, setTipToolSize] = useState({
        width: 0,
        height: 0,
    });
    const [x, setCoordX] = useState(0);
    const [y, setCoordY] = useState(0);
    const [activeCircleIndex, setActiveCircleIndex] = useState(0);
    const mousemove = ({ currentTarget, clientX, clientY }: MouseEvent) => {
        const { width, height, left, top } = (currentTarget as HTMLDivElement)
            .getBoundingClientRect();
        const offsetX = clientX - left, offsetY = clientY - top;
        if (offsetY + tipToolHeight >= height - 10) {
            setCoordY(offsetY - tipToolHeight - 10);
        } else setCoordY(offsetY + 10);
        for (let i = 0; i < hoverRange.length; i++) {
            if (offsetX < hoverRange[i][1] && offsetX > hoverRange[i][0]) {
                setActiveCircleIndex(i);
                if (
                    offsetX + tipToolWidth >= width ||
                    hoverRange[i][1] + tipToolWidth >= width
                ) {
                    setCoordX(hoverRange[i - 1][1] - tipToolWidth);
                } else setCoordX(hoverRange[i][1]);
                break;
            }
        }
    };

    return (
        <ChartProvider
            value={{
                padding,
                bottom: 10,
                height,
                width,
                data,
                activeCircleIndex,
                isHover,
                offsetX: x,
                offsetY: y,
                setTipToolSize,
            }}
        >
            <div
                {...hoverEleRef}
                onMouseMove={mousemove}
                class="group inline-block relative"
            >
                <svg
                    width={width}
                    height={height}
                    viewBox={`0 0 ${width} ${height}`}
                >
                    <g transform={`translate(0, ${height}) scale(1, -1)`}>
                        {children}
                    </g>
                </svg>
                <ChartTipTool />
            </div>
        </ChartProvider>
    );
}

export interface GridLineProps {
    lines?: number;
}

export function GridLine({ lines = 5 }: GridLineProps) {
    const { padding, width, height, bottom } = useChartContext();
    const lineGap = (height - padding - 5 - bottom) / (lines - 1);
    return (
        <g stroke-opacity={0.5} stroke-width={1}>
            {Array.from({ length: lines }).map((_, i) => (
                <line
                    x1={0}
                    x2={width}
                    y1={padding + bottom + lineGap * i}
                    y2={padding + bottom + lineGap * i}
                    stroke="#ccc"
                />
            ))}
        </g>
    );
}

export interface LineChartProps {
    dataKey: string;
}
export function LineChart({ dataKey }: LineChartProps) {
    const { data, padding, height, width, activeCircleIndex, isHover, bottom } = useChartContext();
    const paths = useMemo(() => data.map((d) => d[dataKey]), [data, dataKey]);
    const maxValue = useMemo(
        () => paths.reduce((acc, val) => val > acc ? val : acc, 0),
        [paths],
    );
    const relativePath = useMemo(() => {
        let x = padding;
        return paths.map((pointY) => {
            const point = [
                x,
                (pointY / maxValue) * (height - padding * 2 - bottom * 2) +
                padding + bottom,
            ];
            x += (width - padding * 2) / (paths.length - 1);
            return point;
        });
    }, [maxValue, height, paths, padding, bottom]);

    return (
        <g>
            <path
                fill="none"
                class="stroke-blue-500"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
                d={"M" + relativePath.map((path) => path.join(",")).join(" ")}
            />
            <g class="fill-blue-500">
                {relativePath.map(([x, y], i) => (
                    <circle
                        cx={x}
                        cy={y}
                        r={3}
                        class={activeCircleIndex === i && isHover ? "fill-red-500" : ""}
                    />
                ))}
            </g>
        </g>
    );
}

export interface XAxisProps {
    dataKey: string;
    formater?: (text: string) => string;
}
export function XAxis({ dataKey, formater }: XAxisProps) {
    const { data, padding, width, height, bottom } = useChartContext();
    const XAxisText = useMemo(() => data.map((d) => d[dataKey]), [
        data,
        dataKey,
    ]);
    const textXCoord = useMemo(() => {
        let x = padding;
        return XAxisText.map(() => {
            const point = x;
            x += (width - padding * 2) / (XAxisText.length - 1);
            return point;
        });
    }, [data, padding, XAxisText]);
    return (
        <g>
            {XAxisText.map((text, i) => (
                <text
                    x={textXCoord[i]}
                    y={height - bottom}
                    transform={`translate(0, ${height}) scale(1, -1)`}
                    text-anchor="middle"
                    font-size={12}
                >
                    {formater ? formater(text) : text}
                </text>
            ))}
        </g>
    );
}

export function ChartTipTool() {
    const {
        offsetX,
        offsetY,
        isHover,
        setTipToolSize,
        activeCircleIndex,
        data,
    } = useChartContext();
    const ref = useElementRectCallback<HTMLDivElement>(({ height, width }) => setTipToolSize({ height, width }));
    return (
        <div
            ref={ref}
            class={[
                isHover ? "visible" : "invisible",
                "absolute top-0 left-0",
                "flex items-center gap-4",
                "rounded-md shadow-md px-2 py-[2px] bg-white w-[100px]",
                "ring-1 ring-slate-100",
                "text-[12px]",
            ].join(" ")}
            style={{
                pointerEvents: "none",
                transform: `translate(${offsetX}px, ${offsetY}px)`,
                transition: isHover ? "transform 400ms ease 0ms" : void 0,
            }}
        >
            <div class="w-[3px] h-[16px] rounded-full bg-blue-500" />
            <div class="flex-1 flex justify-between items-center">
                {Object.entries(data[activeCircleIndex]).map(([_, val]) => <span>{val as string}</span>)}
            </div>
        </div>
    );
}
