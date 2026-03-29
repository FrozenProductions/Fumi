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
import { useAppZoom } from "../../../hooks/app/useAppZoom";
import { AppIcon } from "../AppIcon";
import { AppInput } from "../AppInput";
import { AppSelect } from "../AppSelect";

export function AppSettingsGeneralSection(): ReactElement {
    const { zoomPercent, setZoomPercent } = useAppZoom();
    const theme = useAppStore((state) => state.theme);
    const setTheme = useAppStore((state) => state.setTheme);

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
                <div className="flex items-start gap-4 rounded-[1rem] border border-fumi-200 bg-fumi-100/80 p-4">
                    <img
                        src={fumiIcon}
                        alt={`${APP_TITLE} icon`}
                        className="size-12 shrink-0"
                    />
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <p className="text-[15px] font-semibold tracking-[-0.02em] text-fumi-900">
                                {APP_TITLE}
                            </p>
                            <span className="inline-flex h-5 items-center rounded-full border border-fumi-200 bg-fumi-50 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-fumi-500">
                                v{APP_VERSION}
                            </span>
                        </div>
                        <p className="mt-1 text-xs leading-[1.6] text-fumi-500">
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
