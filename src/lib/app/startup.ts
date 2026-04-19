import warningIcon from "../../assets/icons/warning.svg";
import {
    STARTUP_ERROR_ACCENT,
    STARTUP_ERROR_BACKGROUND,
    STARTUP_ERROR_TEXT,
} from "../../constants/app/app";

export function renderStartupError(_message: string): void {
    const root = document.getElementById("root");

    if (!root) {
        return;
    }

    root.innerHTML = `
        <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 32px; background: ${STARTUP_ERROR_BACKGROUND}; color: ${STARTUP_ERROR_TEXT}; font-family: 'Plus Jakarta Sans', sans-serif;">
            <div style="display: flex; width: 100%; max-width: 720px; flex-direction: column; align-items: center; text-align: center;">
                <div aria-hidden="true" style="height: 96px; width: 96px; background: ${STARTUP_ERROR_ACCENT}; mask: url('${warningIcon}') center / contain no-repeat; -webkit-mask: url('${warningIcon}') center / contain no-repeat;"></div>
                <p style="margin: 20px 0 0; font-size: 10px; font-weight: 700; letter-spacing: 0.32em; text-transform: uppercase; color: rgb(122 117 106);">
                    Runtime Error
                </p>
                <p style="margin: 16px 0 0; font-size: 18px; font-weight: 600; letter-spacing: -0.03em; color: ${STARTUP_ERROR_TEXT};">
                    Fumi hit an unrecoverable runtime error.
                </p>
                <p style="margin: 14px 0 0; max-width: 680px; font-size: 16px; line-height: 1.75; color: rgb(120 116 107);">
                    Something failed after the app was already running. Reload the app to try again.
                </p>
                <button id="runtime-error-reload-button" type="button" class="app-select-none inline-flex h-10 items-center gap-2 rounded-[0.8rem] border border-fumi-200 bg-fumi-600 px-4 text-sm font-semibold tracking-[0.01em] text-white transition-[background-color,border-color,transform] duration-150 ease-out hover:-translate-y-0.5 hover:border-fumi-700 hover:bg-fumi-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-2 focus-visible:ring-offset-fumi-50" style="margin-top: 24px;">
                    Reload app
                </button>
            </div>
        </div>
    `;

    const reloadButton = document.getElementById("runtime-error-reload-button");

    if (reloadButton instanceof HTMLButtonElement) {
        reloadButton.addEventListener("click", () => {
            window.location.reload();
        });
    }
}

export function normalizeStartupError(error: unknown): string {
    if (error instanceof Error && error.message) {
        return error.message;
    }

    if (typeof error === "string" && error.trim().length > 0) {
        return error;
    }

    return "The app failed to finish starting.";
}
