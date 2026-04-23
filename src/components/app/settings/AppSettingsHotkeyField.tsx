import type { ReactElement } from "react";
import { AppAnimatedText } from "../common/AppAnimatedText";
import type { AppSettingsHotkeyFieldProps } from "./appSettingsHotkeys.type";

/**
 * Renders a single hotkey binding row with recording and reset controls.
 *
 * @param props - Component props
 */
export function AppSettingsHotkeyField({
    action,
    label,
    shortcutLabel,
    isEditable,
    isCustomized,
    isRecording,
    statusMessage,
    lockedMessage,
    onStartRecording,
    onCancelRecording,
    onReset,
}: AppSettingsHotkeyFieldProps): ReactElement {
    const handleButtonClick = (): void => {
        if (isRecording) {
            onCancelRecording();
        } else {
            onStartRecording(action);
        }
    };

    const buttonLabel = isRecording ? "Press keys..." : shortcutLabel;

    return (
        <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-fumi-900">{label}</p>
                <div className="mt-1 flex items-center gap-2">
                    {lockedMessage ? (
                        <span className="shrink-0 rounded-full bg-fumi-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-fumi-500">
                            {lockedMessage}
                        </span>
                    ) : null}
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
                {statusMessage ? (
                    <p className="text-[10px] font-medium text-rose-600">
                        {statusMessage}
                    </p>
                ) : null}
                <button
                    type="button"
                    onClick={handleButtonClick}
                    disabled={!isEditable}
                    className={`app-select-none inline-flex h-[22px] items-center justify-center rounded-[0.5rem] border px-1.5 text-[10px] font-semibold tracking-[0.01em] transition-[background-color,border-color,color,min-width] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-2 focus-visible:ring-offset-fumi-50 disabled:cursor-default disabled:opacity-50 ${
                        isRecording
                            ? "min-w-[5.5rem] border-fumi-300 bg-fumi-100 text-fumi-800"
                            : "min-w-[3.5rem] border-fumi-200 bg-fumi-50 text-fumi-700 hover:border-fumi-300 hover:bg-fumi-100 hover:text-fumi-800"
                    }`}
                >
                    <AppAnimatedText
                        text={buttonLabel}
                        animateOnInitialRender={false}
                    />
                </button>

                {!isRecording && isCustomized ? (
                    <button
                        type="button"
                        onClick={() => onReset(action)}
                        className="app-select-none inline-flex h-[22px] items-center justify-center rounded-[0.5rem] border border-fumi-200 bg-fumi-50 px-1.5 text-[10px] font-semibold text-fumi-600 transition-[background-color,border-color,color] duration-150 ease-out hover:border-fumi-300 hover:bg-fumi-100 hover:text-fumi-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-2 focus-visible:ring-offset-fumi-50"
                    >
                        Reset
                    </button>
                ) : null}
            </div>
        </div>
    );
}
