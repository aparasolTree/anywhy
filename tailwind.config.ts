import type { Config } from "tailwindcss";

export default {
    content: [
        "{routes,islands,components,doc,utils}/**/*.{ts,tsx}",
    ],
    theme: {
        fontFamily: {
            "sans": ["ZCOOL KuaiLe", "sans-serif"],
        },
        extend: {
            keyframes: {
                "modal-show": {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                "enter": {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                "leave": {
                    "0%": { opacity: "1" },
                    "100%": { opacity: "0" },
                },
                "drawer-left-enter": {
                    "0%": { transform: "translateX(-100%)", opacity: "0" },
                    "100%": { transform: "translateX(0%)", opacity: "1" },
                },
                "drawer-left-leave": {
                    "0%": { transform: "translateX(0%)", opacity: "1" },
                    "100%": { transform: "translateX(-100%)", opacity: "0" },
                },
                "drawer-right-enter": {
                    "0%": { transform: "translateX(100%)", opacity: "0" },
                    "100%": { transform: "translateX(0%)", opacity: "1" },
                },
                "drawer-right-leave": {
                    "0%": { transform: "translateX(0%)", opacity: "1" },
                    "100%": { transform: "translateX(100%)", opacity: "0" },
                },
                success: {
                    "0%": { width: "0px", height: "0px", opacity: "0" },
                    "40%": { width: "0px", height: "6px", opacity: "1" },
                    "100%": { width: "12px", height: "6px", opacity: "1" },
                },
                circle: {
                    "0%": {
                        transform: "rotate(-45deg) scale(0.6)",
                        opacity: "0",
                    },
                    "90%": {
                        transform: "rotate(-45deg) scale(1.1)",
                        opacity: "1",
                    },
                    "100%": {
                        transform: "rotate(-45deg) scale(1)",
                        opacity: "1",
                    },
                },
                "circle-warnning": {
                    "0%": { transform: "scale(0.6)", opacity: "0" },
                    "90%": { transform: "scale(1.1)", opacity: "1" },
                    "100%": { transform: "scale(1)", opacity: "1" },
                },
                "error-one-line": {
                    "0%": { transform: "scaleY(0)", opacity: "0" },
                    "100%": { transform: "scaleY(1)", opacity: "1" },
                },
                "error-two-line": {
                    "0%": {
                        transform: "rotate(90deg) scaleY(0)",
                        opacity: "0",
                    },
                    "100%": {
                        transform: "rotate(90deg) scaleY(1)",
                        opacity: "1",
                    },
                },
                warnning: {
                    "0%": { transform: "rotate(15deg)" },
                    "20%": { transform: "rotate(-30deg)" },
                    "40%": { transform: "rotate(30deg)" },
                    "60%": { transform: "rotate(-30deg)" },
                    "80%": { transform: "rotate(30deg)" },
                    "100%": { transform: "rotate(-15deg)" },
                },
                icon: {
                    "0%": { transform: "scale(0.6)", opacity: "0" },
                    "100%": { transform: "scale(1)", opacity: "1" },
                },
            },
            animation: {
                "modal-show": "modal-show 60ms ease-in-out forwards",
                "enter": "enter 200ms ease-in-out forwards",
                "leave": "leave 200ms ease-in-out forwards",

                "success": "success 300ms ease-in-out 100ms",
                "error-one-line": "error-one-line 300ms ease-in-out 100ms",
                "error-two-line": "error-two-line 300ms ease-in-out 100ms",
                "warnning": "warnning 300ms ease-in-out 100ms",
                "icon": "icon 200ms ease-in-out 150ms forwards",
                "circle": "circle 200ms ease-in-out 100ms forwards",
                "circle-warnning": "circle-warnning 200ms ease-in-out 100ms forwards",

                "drawer-left-enter": "drawer-left-enter 180ms ease-in-out forwards",
                "drawer-left-leave": "drawer-left-leave 180ms ease-in-out forwards",
                "drawer-right-enter": "drawer-right-enter 180ms ease-in-out forwards",
                "drawer-right-leave": "drawer-right-leave 180ms ease-in-out forwards",
            },
        },
    },
} satisfies Config;
