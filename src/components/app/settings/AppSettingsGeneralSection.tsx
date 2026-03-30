import { Add01Icon, MinusSignIcon } from "@hugeicons/core-free-icons";
import type { ReactElement } from "react";
import fumiIcon from "../../../assets/fumi.png";
import {
    APP_AUTHOR_NAME,
    APP_AUTHOR_URL,
    APP_DESCRIPTION,
    APP_TITLE,
    APP_VERSION,
} from "../../../constants/app/app";
import {
    APP_THEME_OPTIONS,
    APP_ZOOM_MAX,
    APP_ZOOM_MIN,
    APP_ZOOM_STEP,
} from "../../../constants/app/settings";
import { useAppStore } from "../../../hooks/app/useAppStore";
import type { UseAppUpdaterResult } from "../../../hooks/app/useAppUpdater";
import { useAppZoom } from "../../../hooks/app/useAppZoom";
import type { AppUpdateDownloadProgress } from "../../../types/app/updater";
import { AppIcon } from "../AppIcon";
import { AppInput } from "../AppInput";
import { AppSelect } from "../AppSelect";

type AppSettingsGeneralSectionProps = {
    updater: UseAppUpdaterResult;
};

function formatUpdateDate(date: string | null): string | null {
    if (!date) {
        return null;
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return null;
    }

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(parsedDate);
}

function formatByteCount(value: number | null): string | null {
    if (value === null || value <= 0) {
        return null;
    }

    if (value < 1024) {
        return `${value} B`;
    }

    const units = ["KB", "MB", "GB"];
    let currentValue = value / 1024;
    let unitIndex = 0;

    while (currentValue >= 1024 && unitIndex < units.length - 1) {
        currentValue /= 1024;
        unitIndex += 1;
    }

    return `${currentValue.toFixed(currentValue >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

function getUpdaterDescription(): string {
    return "See whether a new desktop update is available.";
}

function getProgressSummary(
    progress: AppUpdateDownloadProgress | null,
): string | null {
    if (!progress) {
        return null;
    }

    const downloadedText = formatByteCount(progress.downloadedBytes);
    const totalText = formatByteCount(progress.contentLength);

    if (!downloadedText || !totalText) {
        return progress.progressPercent === null
            ? null
            : `${progress.progressPercent}% downloaded`;
    }

    return `${downloadedText} of ${totalText} downloaded`;
}

export function AppSettingsGeneralSection({
    updater,
}: AppSettingsGeneralSectionProps): ReactElement {
    const { zoomPercent, setZoomPercent } = useAppZoom();
    const theme = useAppStore((state) => state.theme);
    const setTheme = useAppStore((state) => state.setTheme);
    const {
        status: updaterStatus,
        availableUpdate,
        downloadProgress,
        errorMessage,
        checkForUpdates,
        downloadAndInstallUpdate,
        relaunchToApplyUpdate,
    } = updater;
    const formattedUpdateDate = formatUpdateDate(availableUpdate?.date ?? null);
    const progressSummary = getProgressSummary(downloadProgress);
    const shouldDisableCheckButton =
        updaterStatus === "checking" ||
        updaterStatus === "downloading" ||
        updaterStatus === "installing";
    const shouldDisableInstallButton =
        updaterStatus === "downloading" || updaterStatus === "installing";

    const handleZoomPercentChange = (value: string): void => {
        void setZoomPercent(Number(value));
    };

    const handleZoomOut = (): void => {
        void setZoomPercent(zoomPercent - APP_ZOOM_STEP);
    };

    const handleZoomIn = (): void => {
        void setZoomPercent(zoomPercent + APP_ZOOM_STEP);
    };

    return (
        <div className="flex w-full flex-col divide-y divide-fumi-200/80">
            <div className="py-4">
                <div className="overflow-hidden rounded-[1rem] border border-fumi-200 bg-fumi-100/80">
                    <div className="flex items-start gap-4 p-4">
                        <img
                            src={fumiIcon}
                            alt={`${APP_TITLE} icon`}
                            className="size-12 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <p className="text-[15px] font-semibold tracking-[-0.02em] text-fumi-900">
                                        {APP_TITLE}
                                    </p>
                                    <span className="inline-flex h-5 items-center rounded-full border border-fumi-200 bg-fumi-50 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-fumi-500">
                                        v{APP_VERSION}
                                    </span>
                                </div>
                            </div>
                            <p className="mt-1.5 text-xs leading-[1.6] text-fumi-500">
                                {APP_DESCRIPTION}
                            </p>
                            <p className="mt-3 text-xs font-medium text-fumi-500">
                                Made by{" "}
                                <a
                                    href={APP_AUTHOR_URL}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-semibold text-fumi-700 underline decoration-fumi-300 underline-offset-2 transition-colors hover:text-fumi-900"
                                >
                                    {APP_AUTHOR_NAME}
                                </a>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-fumi-200/60 bg-fumi-50/50 px-4 py-3">
                        <p className="min-w-0 flex-1 whitespace-nowrap text-xs font-medium text-fumi-600">
                            {getUpdaterDescription()}
                        </p>
                        <div className="flex shrink-0 items-center gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    void checkForUpdates();
                                }}
                                disabled={shouldDisableCheckButton}
                                className="rounded-[0.6rem] border border-fumi-200 bg-fumi-50 px-3 py-1.5 text-[11px] font-semibold text-fumi-700 transition-[background-color,border-color,color] duration-150 hover:border-fumi-300 hover:bg-fumi-200 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {updaterStatus === "checking"
                                    ? "Checking..."
                                    : "Check for updates"}
                            </button>
                            {updaterStatus === "available" ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        void downloadAndInstallUpdate();
                                    }}
                                    disabled={shouldDisableInstallButton}
                                    className="rounded-[0.6rem] border border-fumi-700 bg-fumi-900 px-3 py-1.5 text-[11px] font-semibold text-fumi-50 shadow-sm transition-[background-color,border-color,color] duration-150 hover:bg-fumi-800 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Download and install
                                </button>
                            ) : null}
                            {updaterStatus === "readyToRestart" ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        void relaunchToApplyUpdate();
                                    }}
                                    className="rounded-[0.6rem] border border-fumi-700 bg-fumi-900 px-3 py-1.5 text-[11px] font-semibold text-fumi-50 shadow-sm transition-[background-color,border-color,color] duration-150 hover:bg-fumi-800"
                                >
                                    Restart now
                                </button>
                            ) : null}
                        </div>
                    </div>

                    {(availableUpdate ||
                        progressSummary ||
                        errorMessage ||
                        updaterStatus === "unsupported") && (
                        <div className="border-t border-fumi-200/60 bg-fumi-50/30 px-4 py-3">
                            <div className="space-y-3">
                                {(availableUpdate || formattedUpdateDate) && (
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fumi-500">
                                        {availableUpdate ? (
                                            <span>
                                                Latest version{" "}
                                                <span className="font-semibold text-fumi-800">
                                                    v{availableUpdate.version}
                                                </span>
                                            </span>
                                        ) : null}
                                        {formattedUpdateDate ? (
                                            <span>
                                                Published {formattedUpdateDate}
                                            </span>
                                        ) : null}
                                    </div>
                                )}

                                {progressSummary ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between gap-3 text-xs text-fumi-500">
                                            <span>{progressSummary}</span>
                                            {downloadProgress?.progressPercent !==
                                                null &&
                                            downloadProgress?.progressPercent !==
                                                undefined ? (
                                                <span className="font-semibold text-fumi-800">
                                                    {
                                                        downloadProgress?.progressPercent
                                                    }
                                                    %
                                                </span>
                                            ) : null}
                                        </div>
                                        <div className="h-1.5 overflow-hidden rounded-full bg-fumi-200">
                                            <div
                                                className="h-full rounded-full bg-fumi-700 transition-[width] duration-200 ease-out"
                                                style={{
                                                    width: `${downloadProgress?.progressPercent ?? 10}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ) : null}

                                {errorMessage ? (
                                    <p className="rounded-[0.6rem] border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-[1.6] text-rose-700">
                                        {errorMessage}
                                    </p>
                                ) : null}

                                {availableUpdate?.body ? (
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-fumi-400">
                                            Release notes
                                        </p>
                                        <div className="mt-1.5 max-h-32 overflow-y-auto rounded-[0.5rem] border border-fumi-200/50 bg-fumi-50/50 p-2.5">
                                            <p className="whitespace-pre-wrap text-xs leading-[1.65] text-fumi-600">
                                                {availableUpdate.body}
                                            </p>
                                        </div>
                                    </div>
                                ) : null}

                                {updaterStatus === "unsupported" ? (
                                    <p className="text-xs leading-[1.6] text-fumi-500">
                                        Web-only mode keeps the updater disabled
                                        so local UI work can run without the
                                        Tauri desktop shell.
                                    </p>
                                ) : null}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="flex items-center justify-between gap-6 py-4">
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-fumi-900">Theme</p>
                    <p className="mt-1 text-xs leading-[1.55] text-fumi-400">
                        Switch the app between the light and dark color themes.
                    </p>
                </div>
                <AppSelect
                    value={theme}
                    options={APP_THEME_OPTIONS}
                    onChange={setTheme}
                    className="shrink-0"
                />
            </div>
            <div className="flex items-center justify-between gap-6 py-4">
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-fumi-900">
                        App zoom
                    </p>
                    <p className="mt-1 text-xs leading-[1.55] text-fumi-400">
                        Scale the full app interface for the current window.
                    </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                    <button
                        type="button"
                        aria-label="Zoom out"
                        onClick={handleZoomOut}
                        className="flex size-8 items-center justify-center rounded-[0.65rem] border border-fumi-200 bg-fumi-50 text-fumi-500 transition-[background-color,color,border-color] hover:border-fumi-300 hover:bg-fumi-100 hover:text-fumi-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600"
                    >
                        <AppIcon
                            icon={MinusSignIcon}
                            size={14}
                            strokeWidth={2.5}
                        />
                    </button>
                    <AppInput
                        value={String(zoomPercent)}
                        ariaLabel="App zoom percentage"
                        onChange={handleZoomPercentChange}
                        minValue={APP_ZOOM_MIN}
                        maxValue={APP_ZOOM_MAX}
                        maxLength={3}
                        inputMode="numeric"
                        suffix="%"
                        step={APP_ZOOM_STEP}
                        size="sm"
                        className="shrink-0"
                    />
                    <button
                        type="button"
                        aria-label="Zoom in"
                        onClick={handleZoomIn}
                        className="flex size-8 items-center justify-center rounded-[0.65rem] border border-fumi-200 bg-fumi-50 text-fumi-500 transition-[background-color,color,border-color] hover:border-fumi-300 hover:bg-fumi-100 hover:text-fumi-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600"
                    >
                        <AppIcon icon={Add01Icon} size={14} strokeWidth={2.5} />
                    </button>
                </div>
            </div>
        </div>
    );
}
