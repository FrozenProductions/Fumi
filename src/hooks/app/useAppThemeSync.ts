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

function getSystemTheme(): "light" | "dark" {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
}

function applyTheme(resolvedTheme: "light" | "dark"): void {
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
}

export function useAppThemeSync(): void {
    const theme = useAppStore((state) => state.theme);

    useLayoutEffect(() => {
        const restoreTransitions = disableAppTransitions();
        let secondAnimationFrameId = 0;

        if (theme === "system") {
            applyTheme(getSystemTheme());

            const mediaQuery = window.matchMedia(
                "(prefers-color-scheme: dark)",
            );

            const handleSystemThemeChange = (): void => {
                const restoreAfterChange = disableAppTransitions();
                applyTheme(getSystemTheme());

                const f1 = window.requestAnimationFrame(() => {
                    window.requestAnimationFrame(() => {
                        restoreAfterChange();
                    });
                });

                return void f1;
            };

            mediaQuery.addEventListener("change", handleSystemThemeChange);

            const firstAnimationFrameId = window.requestAnimationFrame(() => {
                secondAnimationFrameId = window.requestAnimationFrame(() => {
                    restoreTransitions();
                });
            });

            return () => {
                window.cancelAnimationFrame(firstAnimationFrameId);
                window.cancelAnimationFrame(secondAnimationFrameId);
                mediaQuery.removeEventListener(
                    "change",
                    handleSystemThemeChange,
                );
                restoreTransitions();
            };
        }

        applyTheme(theme);

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
