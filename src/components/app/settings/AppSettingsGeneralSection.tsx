import { Add01Icon, MinusSignIcon } from "@hugeicons/core-free-icons";
import { type ReactElement, useEffect, useRef, useState } from "react";
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
import { useAppZoom } from "../../../hooks/app/useAppZoom";
import type { AppUpdaterStatus } from "../../../lib/app/app.type";
import {
    getAppUpdaterPhrase,
    shouldRefreshAppUpdaterPhrase,
} from "../../../lib/app/updatePhrases";
import { getAppUpdateProgressSummary } from "../../../lib/app/updaterPresentation";
import { openExternalUrl } from "../../../lib/platform/opener";
import { AppAnimatedText } from "../AppAnimatedText";
import { AppIcon } from "../AppIcon";
import { AppInput } from "../AppInput";
import { AppSelect } from "../AppSelect";
import { AppSettingsToggle } from "../AppSettingsToggle";
import type { AppSettingsGeneralSectionProps } from "./appSettings.type";

export function AppSettingsGeneralSection({
    updater,
}: AppSettingsGeneralSectionProps): ReactElement {
    const { zoomPercent, setZoomPercent } = useAppZoom();
    const theme = useAppStore((state) => state.theme);
    const setTheme = useAppStore((state) => state.setTheme);
    const isAutoUpdateEnabled = useAppStore(
        (state) => state.updaterSettings.isAutoUpdateEnabled,
    );
    const setAutoUpdateEnabled = useAppStore(
        (state) => state.setAutoUpdateEnabled,
    );
    const {
        status: updaterStatus,
        availableUpdate,
        downloadProgress,
        errorMessage,
        checkForUpdates,
        downloadAndInstallUpdate,
        relaunchToApplyUpdate,
    } = updater;
    const displayedAvailableUpdate = availableUpdate;
    const displayedUpdaterStatus = updaterStatus;
    const displayedDownloadProgress = downloadProgress;
    const [updaterPhrase, setUpdaterPhrase] = useState(() =>
        getAppUpdaterPhrase(displayedUpdaterStatus),
    );
    const previousUpdaterStatusRef = useRef<AppUpdaterStatus>(
        displayedUpdaterStatus,
    );
    const progressSummary = getAppUpdateProgressSummary(
        displayedDownloadProgress,
    );
    const shouldDisableCheckButton =
        displayedUpdaterStatus === "checking" ||
        displayedUpdaterStatus === "downloading" ||
        displayedUpdaterStatus === "installing";
    const updaterButtonBaseClassName =
        "app-select-none inline-flex h-8 items-center justify-center rounded-[0.65rem] px-3 text-xs font-semibold tracking-[0.01em] transition-[background-color,border-color,color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-2 focus-visible:ring-offset-fumi-50 disabled:pointer-events-none disabled:opacity-50";
    const checkForUpdatesButtonLabel =
        displayedUpdaterStatus === "checking"
            ? "Checking..."
            : displayedUpdaterStatus === "available" && displayedAvailableUpdate
              ? `Download v${displayedAvailableUpdate.version}`
              : "Check for updates";
    const checkForUpdatesButtonClassName =
        displayedUpdaterStatus === "available" && displayedAvailableUpdate
            ? theme === "dark"
                ? "app-select-none pointer-events-auto inline-flex h-8 items-center justify-center gap-1.5 rounded-[0.5rem] border border-fumi-300 bg-fumi-700 px-3 text-[11px] font-semibold tracking-wide text-fumi-50 shadow-sm transition-[background-color,border-color,transform,box-shadow] duration-150 ease-out hover:-translate-y-0.5 hover:border-fumi-400 hover:bg-fumi-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-2 focus-visible:ring-offset-fumi-50 disabled:pointer-events-none disabled:opacity-50"
                : "app-select-none pointer-events-auto inline-flex h-8 items-center justify-center gap-1.5 rounded-[0.5rem] border border-fumi-200 bg-fumi-600 px-3 text-[11px] font-semibold tracking-wide text-white shadow-sm transition-[background-color,border-color,transform,box-shadow] duration-150 ease-out hover:-translate-y-0.5 hover:border-fumi-700 hover:bg-fumi-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-2 focus-visible:ring-offset-fumi-50 disabled:pointer-events-none disabled:opacity-50"
            : theme === "dark"
              ? `${updaterButtonBaseClassName} border border-fumi-300 bg-fumi-100 text-fumi-800 shadow-[0_1px_2px_rgb(0_0_0_/_0.18)] hover:border-fumi-400 hover:bg-fumi-200 hover:text-fumi-900`
              : `${updaterButtonBaseClassName} border border-fumi-200 bg-fumi-100 text-fumi-700 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.55)] hover:border-fumi-300 hover:bg-fumi-200 hover:text-fumi-900`;
    const restartButtonClassName = `${updaterButtonBaseClassName} border border-fumi-700 bg-fumi-900 text-fumi-50 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.08),0_1px_2px_rgb(15_23_42_/_0.12)] hover:border-fumi-800 hover:bg-fumi-800`;

    const handleZoomPercentChange = (value: string): void => {
        void setZoomPercent(Number(value));
    };

    const handleZoomOut = (): void => {
        void setZoomPercent(zoomPercent - APP_ZOOM_STEP);
    };

    const handleZoomIn = (): void => {
        void setZoomPercent(zoomPercent + APP_ZOOM_STEP);
    };

    const handleCheckForUpdatesAction = (): void => {
        if (
            displayedUpdaterStatus === "available" &&
            displayedAvailableUpdate
        ) {
            void downloadAndInstallUpdate();
            return;
        }

        void checkForUpdates();
    };

    const handleAutoUpdateToggle = (): void => {
        setAutoUpdateEnabled(!isAutoUpdateEnabled);
    };

    const handleOpenAuthorUrl = (): void => {
        void openExternalUrl(APP_AUTHOR_URL);
    };

    useEffect(() => {
        if (displayedUpdaterStatus === previousUpdaterStatusRef.current) {
            return;
        }

        previousUpdaterStatusRef.current = displayedUpdaterStatus;

        if (!shouldRefreshAppUpdaterPhrase(displayedUpdaterStatus)) {
            return;
        }

        setUpdaterPhrase((currentPhrase) =>
            getAppUpdaterPhrase(displayedUpdaterStatus, currentPhrase),
        );
    }, [displayedUpdaterStatus]);

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
                                <button
                                    type="button"
                                    onClick={handleOpenAuthorUrl}
                                    className="font-semibold text-fumi-700 underline decoration-fumi-300 underline-offset-2 transition-colors hover:text-fumi-900"
                                >
                                    {APP_AUTHOR_NAME}
                                </button>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-fumi-200/60 bg-fumi-50/50 pl-4 pr-3 py-3">
                        <p className="min-w-0 flex-1 whitespace-nowrap text-xs font-medium text-fumi-600">
                            <AppAnimatedText text={updaterPhrase} />
                        </p>
                        <div className="flex shrink-0 items-center gap-2">
                            <button
                                type="button"
                                onClick={handleCheckForUpdatesAction}
                                disabled={shouldDisableCheckButton}
                                className={checkForUpdatesButtonClassName}
                            >
                                {checkForUpdatesButtonLabel}
                            </button>
                            {displayedUpdaterStatus === "readyToRestart" ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        void relaunchToApplyUpdate();
                                    }}
                                    className={restartButtonClassName}
                                >
                                    Restart now
                                </button>
                            ) : null}
                        </div>
                    </div>

                    {(progressSummary ||
                        errorMessage ||
                        displayedUpdaterStatus === "unsupported") && (
                        <div className="border-t border-fumi-200/60 bg-fumi-50/30 px-4 py-3">
                            <div className="space-y-3">
                                {progressSummary ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between gap-3 text-xs text-fumi-500">
                                            <span>{progressSummary}</span>
                                            {displayedDownloadProgress?.progressPercent !==
                                                null &&
                                            displayedDownloadProgress?.progressPercent !==
                                                undefined ? (
                                                <span className="font-semibold text-fumi-800">
                                                    {
                                                        displayedDownloadProgress?.progressPercent
                                                    }
                                                    %
                                                </span>
                                            ) : null}
                                        </div>
                                        <div className="h-1.5 overflow-hidden rounded-full bg-fumi-200">
                                            <div
                                                className="h-full rounded-full bg-fumi-700 transition-[width] duration-200 ease-out"
                                                style={{
                                                    width: `${displayedDownloadProgress?.progressPercent ?? 10}%`,
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

                                {displayedUpdaterStatus === "unsupported" ? (
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
                        Switch the app between light, dark, or system theme.
                    </p>
                </div>
                <AppSelect
                    value={theme}
                    options={APP_THEME_OPTIONS}
                    onChange={setTheme}
                    className="shrink-0"
                />
            </div>
            <AppSettingsToggle
                label="Auto-update"
                description="Auto-download updates and prompt before restart."
                isEnabled={isAutoUpdateEnabled}
                onChange={handleAutoUpdateToggle}
            />
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
                        className="app-select-none flex size-8 items-center justify-center rounded-[0.65rem] border border-fumi-200 bg-fumi-50 text-fumi-500 transition-[background-color,color,border-color] hover:border-fumi-300 hover:bg-fumi-100 hover:text-fumi-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600"
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
                        className="app-select-none flex size-8 items-center justify-center rounded-[0.65rem] border border-fumi-200 bg-fumi-50 text-fumi-500 transition-[background-color,color,border-color] hover:border-fumi-300 hover:bg-fumi-100 hover:text-fumi-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600"
                    >
                        <AppIcon icon={Add01Icon} size={14} strokeWidth={2.5} />
                    </button>
                </div>
            </div>
        </div>
    );
}
