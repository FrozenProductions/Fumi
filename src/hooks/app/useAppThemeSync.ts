import { useLayoutEffect } from "react";
import { APP_THEME_TRANSITION_GUARD_ID } from "../../constants/app/app";
import { useAppStore } from "./useAppStore";

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

/**
 * Syncs application theme to the document and listens for system theme changes.
 *
 * @remarks
 * Disables CSS transitions temporarily during theme changes to prevent flash of
 * unstyled content. Uses requestAnimationFrame double-frame technique to ensure
 * transitions are disabled before and restored after the theme application.
 */
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
