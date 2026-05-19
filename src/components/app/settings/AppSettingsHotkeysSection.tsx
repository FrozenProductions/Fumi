import type { ReactElement } from "react";
import { useAppHotkeyRecorderController } from "../../../hooks/app/hotkeys/useAppHotkeyRecorderController";
import { AppSettingsHotkeyField } from "./AppSettingsHotkeyField";

/**
 * The hotkeys settings section with keyboard shortcut management.
 *
 * @returns A React component
 */
export function AppSettingsHotkeysSection(): ReactElement {
    const hotkeyRecorder = useAppHotkeyRecorderController();

    return (
        <div className="flex w-full flex-col divide-y divide-fumi-200/80">
            <div className="flex items-center justify-between gap-6 py-4">
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-fumi-900">
                        Keyboard shortcuts
                    </p>
                    <p className="mt-1 text-xs leading-[1.55] text-fumi-400">
                        Click a shortcut to record. Press Backspace to disable.
                        Native menu shortcuts stay fixed and are not listed
                        here.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={hotkeyRecorder.onResetAllBindings}
                    disabled={!hotkeyRecorder.hasCustomBindings}
                    className="app-select-none inline-flex h-8 shrink-0 items-center justify-center rounded-[0.65rem] border border-fumi-200 bg-fumi-50 px-3 text-xs font-semibold text-fumi-700 transition-[background-color,border-color,color] hover:border-fumi-300 hover:bg-fumi-100 hover:text-fumi-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-2 focus-visible:ring-offset-fumi-50 disabled:cursor-default disabled:opacity-50"
                >
                    Reset all
                </button>
            </div>

            {hotkeyRecorder.groups.map(({ groupLabel, hotkeys }) => (
                <div key={groupLabel} className="py-4">
                    <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-fumi-500">
                        {groupLabel}
                    </p>
                    <div className="space-y-3">
                        {hotkeys.map((hotkey) => (
                            <AppSettingsHotkeyField
                                key={hotkey.action}
                                action={hotkey.action}
                                label={hotkey.label}
                                shortcutLabel={hotkey.shortcutLabel}
                                isEditable={hotkey.isEditable}
                                isCustomized={hotkey.isCustomized}
                                isDisabled={hotkey.isDisabled}
                                isRecording={
                                    hotkeyRecorder.recordingAction ===
                                        hotkey.action &&
                                    hotkeyRecorder.isRecording
                                }
                                statusMessage={
                                    hotkeyRecorder.statusAction ===
                                    hotkey.action
                                        ? hotkeyRecorder.statusMessage
                                        : null
                                }
                                lockedMessage={
                                    hotkey.isEditable
                                        ? null
                                        : "Fixed by native menu"
                                }
                                onStartRecording={
                                    hotkeyRecorder.onStartRecording
                                }
                                onCancelRecording={
                                    hotkeyRecorder.onCancelRecording
                                }
                                onReset={hotkeyRecorder.onResetBinding}
                                onDisable={hotkeyRecorder.onDisableBinding}
                                onEnable={hotkeyRecorder.onEnableBinding}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
