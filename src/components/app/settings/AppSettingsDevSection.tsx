import type { ReactElement } from "react";
import {
    normalizeStartupError,
    renderStartupError,
} from "../../../lib/app/startup";

const buttonClassName =
    "app-select-none inline-flex h-8 items-center justify-center rounded-[0.65rem] border px-3 text-xs font-semibold tracking-[0.01em] transition-[background-color,border-color,color,box-shadow] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-2 focus-visible:ring-offset-fumi-50";

export function AppSettingsDevSection(): ReactElement {
    const handleReloadApp = (): void => {
        window.location.reload();
    };

    const handleCauseError = (): void => {
        const error = new Error(
            "Dev settings triggered a simulated startup failure.",
        );

        renderStartupError(normalizeStartupError(error));

        window.setTimeout(() => {
            throw error;
        }, 0);
    };

    return (
        <div className="flex w-full flex-col divide-y divide-fumi-200/80">
            <div className="flex items-center justify-between gap-6 py-4">
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-fumi-900">
                        Reload app
                    </p>
                    <p className="mt-1 text-xs leading-[1.55] text-fumi-400">
                        Refresh the current window and rerun app startup in the
                        dev runtime.
                    </p>
                </div>
                <div className="shrink-0">
                    <button
                        type="button"
                        onClick={handleReloadApp}
                        className={`${buttonClassName} border-fumi-200 bg-fumi-50 text-fumi-700 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.55)] hover:border-fumi-300 hover:bg-fumi-200 hover:text-fumi-900`}
                    >
                        Reload app
                    </button>
                </div>
            </div>
            <div className="flex items-center justify-between gap-6 py-4">
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-fumi-900">
                        Cause runtime error
                    </p>
                    <p className="mt-1 text-xs leading-[1.55] text-fumi-400">
                        Trigger a simulated runtime failure and show the runtime
                        error screen.
                    </p>
                </div>
                <div className="shrink-0">
                    <button
                        type="button"
                        onClick={handleCauseError}
                        className={`${buttonClassName} border-rose-300 bg-rose-50 text-rose-700 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.6)] hover:border-rose-400 hover:bg-rose-100 hover:text-rose-800`}
                    >
                        Cause error
                    </button>
                </div>
            </div>
        </div>
    );
}
