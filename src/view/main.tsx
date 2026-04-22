import type { HotkeysProviderOptions } from "@tanstack/react-hotkeys";
import { HotkeysProvider } from "@tanstack/react-hotkeys";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppTooltipHost } from "../components/app/AppTooltipHost";
import { normalizeStartupError, renderStartupError } from "../lib/app/startup";
import { isTauriEnvironment } from "../lib/platform/runtime";
import { initializeWindowShell } from "../lib/platform/window";
import { App } from "./App";
import "./index.css";

export const HOTKEY_PROVIDER_DEFAULT_OPTIONS: HotkeysProviderOptions = {
    hotkey: {
        preventDefault: true,
        stopPropagation: true,
        conflictBehavior: "warn",
    },
};

window.addEventListener("error", (event) => {
    renderStartupError(normalizeStartupError(event.error ?? event.message));
});

window.addEventListener("unhandledrejection", (event) => {
    renderStartupError(normalizeStartupError(event.reason));
});

if (isTauriEnvironment()) {
    void initializeWindowShell();
}

const rootElement = document.getElementById("root");

if (!rootElement) {
    throw new Error("Root element '#root' was not found.");
}

try {
    createRoot(rootElement).render(
        <StrictMode>
            <HotkeysProvider defaultOptions={HOTKEY_PROVIDER_DEFAULT_OPTIONS}>
                <div className="contents">
                    <App />
                    <AppTooltipHost />
                </div>
            </HotkeysProvider>
        </StrictMode>,
    );
} catch (error) {
    renderStartupError(normalizeStartupError(error));
    throw error;
}
