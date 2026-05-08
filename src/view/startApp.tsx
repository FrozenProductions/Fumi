import { HotkeysProvider } from "@tanstack/react-hotkeys";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppTooltipHost } from "../components/app/tooltip/AppTooltipHost";
import { HOTKEY_PROVIDER_DEFAULT_OPTIONS } from "../constants/app/hotkeys";
import { normalizeStartupError, renderStartupError } from "../lib/app/startup";
import { isTauriEnvironment } from "../lib/platform/core/runtime";
import { initializeWindowShell } from "../lib/platform/window/window";
import { App } from "./App";

function handleWindowError(event: ErrorEvent): void {
    renderStartupError(normalizeStartupError(event.error ?? event.message));
}

function handleUnhandledRejection(event: PromiseRejectionEvent): void {
    renderStartupError(normalizeStartupError(event.reason));
}

function registerStartupErrorHandlers(): void {
    window.addEventListener("error", handleWindowError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
}

function initializeAppWindowShell(): void {
    if (!isTauriEnvironment()) {
        return;
    }

    void initializeWindowShell();
}

function getRootElement(): HTMLElement {
    const rootElement = document.getElementById("root");

    if (rootElement === null) {
        throw new Error("Root element '#root' was not found.");
    }

    return rootElement;
}

function renderApp(rootElement: HTMLElement): void {
    createRoot(rootElement).render(
        <StrictMode>
            <HotkeysProvider defaultOptions={HOTKEY_PROVIDER_DEFAULT_OPTIONS}>
                <div className="app-zoom-surface">
                    <App />
                    <AppTooltipHost />
                </div>
            </HotkeysProvider>
        </StrictMode>,
    );
}

export function startApp(): void {
    registerStartupErrorHandlers();
    initializeAppWindowShell();

    try {
        renderApp(getRootElement());
    } catch (error: unknown) {
        renderStartupError(normalizeStartupError(error));
        throw error;
    }
}
