import { useLayoutEffect } from "react";
import { useAppStore } from "./useAppStore";

const APP_THEME_TRANSITION_GUARD_ID = "app-theme-transition-guard";

function disableAppTransitions(): () => void {
    const existingGuard = document.getElementById(
        APP_THEME_TRANSITION_GUARD_ID,
    );

    if (existingGuard) {
        return () => {
            existingGuard.remove();
        };
    }

    const styleElement = document.createElement("style");

    styleElement.id = APP_THEME_TRANSITION_GUARD_ID;
    styleElement.textContent = `
        html,
        body,
        body *,
        body *::before,
        body *::after {
            transition: none !important;
        }
    `;

    document.head.append(styleElement);

    return () => {
        styleElement.remove();
    };
}

export function useAppThemeSync(): void {
    const theme = useAppStore((state) => state.theme);

    useLayoutEffect(() => {
        const restoreTransitions = disableAppTransitions();
        let secondAnimationFrameId = 0;

        document.documentElement.dataset.theme = theme;
        document.documentElement.style.colorScheme = theme;

        const firstAnimationFrameId = window.requestAnimationFrame(() => {
            secondAnimationFrameId = window.requestAnimationFrame(() => {
                restoreTransitions();
            });
        });

        return () => {
            window.cancelAnimationFrame(firstAnimationFrameId);
            window.cancelAnimationFrame(secondAnimationFrameId);
            restoreTransitions();
        };
    }, [theme]);
}
