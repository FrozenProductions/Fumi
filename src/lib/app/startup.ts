const STARTUP_ERROR_BACKGROUND = "rgb(244 243 238)";
const STARTUP_ERROR_BORDER = "rgb(221 219 212)";
const STARTUP_ERROR_TEXT = "rgb(44 43 40)";
const STARTUP_ERROR_ACCENT = "rgb(193 95 60)";

function escapeStartupErrorHtml(message: string): string {
    return message
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

export function renderStartupError(message: string): void {
    const root = document.getElementById("root");

    if (!root) {
        return;
    }

    root.innerHTML = `
        <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; background: ${STARTUP_ERROR_BACKGROUND}; color: ${STARTUP_ERROR_TEXT}; font-family: 'Plus Jakarta Sans', sans-serif;">
            <div style="max-width: 640px; width: 100%; border: 1px solid ${STARTUP_ERROR_BORDER}; border-radius: 20px; background: rgb(255 255 255); padding: 24px; box-shadow: 0 18px 45px rgb(53 23 21 / 0.08);">
                <p style="margin: 0 0 8px; font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: ${STARTUP_ERROR_ACCENT};">Startup Error</p>
                <p style="margin: 0; font-size: 14px; line-height: 1.7;">${escapeStartupErrorHtml(message)}</p>
            </div>
        </div>
    `;
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
