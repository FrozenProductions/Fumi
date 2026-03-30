import { HotkeysProvider } from "@tanstack/react-hotkeys";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppTooltipHost } from "../components/app/AppTooltipHost";
import { isTauriEnvironment } from "../lib/platform/runtime";
import { initializeWindowShell } from "../lib/platform/window";
import { App } from "./App";
import "./index.css";

function renderStartupError(message: string): void {
    const root = document.getElementById("root");

    if (!root) {
        return;
    }

    root.innerHTML = `
        <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; background: rgb(244 243 238); color: rgb(44 43 40); font-family: 'Plus Jakarta Sans', sans-serif;">
            <div style="max-width: 640px; width: 100%; border: 1px solid rgb(221 219 212); border-radius: 20px; background: rgb(255 255 255); padding: 24px; box-shadow: 0 18px 45px rgb(53 23 21 / 0.08);">
                <p style="margin: 0 0 8px; font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: rgb(193 95 60);">Startup Error</p>
                <p style="margin: 0; font-size: 14px; line-height: 1.7;">${message}</p>
            </div>
        </div>
    `;
}

function normalizeStartupError(error: unknown): string {
    if (error instanceof Error && error.message) {
        return error.message;
    }

    if (typeof error === "string" && error.trim().length > 0) {
        return error;
    }

    return "The app failed to finish starting.";
}

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
            <HotkeysProvider
                defaultOptions={{
                    hotkey: {
                        preventDefault: true,
                        stopPropagation: true,
                        conflictBehavior: "warn",
                    },
                }}
            >
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
