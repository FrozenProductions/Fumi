import { hasNonModifierKey } from "@tanstack/hotkeys";
import { useHotkeyRecorder } from "@tanstack/react-hotkeys";
import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import { useAppStore } from "../../../hooks/app/useAppStore";
import type { AppHotkeyAction } from "../../../lib/app/app.type";
import {
    findAppHotkeyConflict,
    getAppHotkeyDefinition,
    getAppHotkeyGroups,
} from "../../../lib/app/hotkeys";
import { AppSettingsHotkeyField } from "./hotkeys/AppSettingsHotkeyField";

/**
 * The hotkeys settings section with keyboard shortcut management.
 *
 * @returns A React component
 */
export function AppSettingsHotkeysSection(): ReactElement {
    const hotkeyBindings = useAppStore((state) => state.hotkeyBindings);
    const setHotkeyBinding = useAppStore((state) => state.setHotkeyBinding);
    const resetHotkeyBinding = useAppStore((state) => state.resetHotkeyBinding);
    const resetAllHotkeyBindings = useAppStore(
        (state) => state.resetAllHotkeyBindings,
    );
    const [recordingAction, setRecordingAction] =
        useState<AppHotkeyAction | null>(null);
    const [statusAction, setStatusAction] = useState<AppHotkeyAction | null>(
        null,
    );
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const recordingActionRef = useRef<AppHotkeyAction | null>(null);
    const statusTimeoutRef = useRef<number | null>(null);
    const groups = getAppHotkeyGroups(hotkeyBindings);
    const hasCustomBindings = Object.keys(hotkeyBindings).length > 0;

    useEffect(() => {
        recordingActionRef.current = recordingAction;
    }, [recordingAction]);

    useEffect(() => {
        if (!statusAction || !statusMessage) {
            if (statusTimeoutRef.current !== null) {
                window.clearTimeout(statusTimeoutRef.current);
                statusTimeoutRef.current = null;
            }

            return;
        }

        statusTimeoutRef.current = window.setTimeout(() => {
            setStatusAction(null);
            setStatusMessage(null);
            statusTimeoutRef.current = null;
        }, 3000);

        return () => {
            if (statusTimeoutRef.current !== null) {
                window.clearTimeout(statusTimeoutRef.current);
                statusTimeoutRef.current = null;
            }
        };
    }, [statusAction, statusMessage]);

    const clearStatus = (): void => {
        if (statusTimeoutRef.current !== null) {
            window.clearTimeout(statusTimeoutRef.current);
            statusTimeoutRef.current = null;
        }

        setStatusAction(null);
        setStatusMessage(null);
    };

    const recorder = useHotkeyRecorder({
        onRecord: (hotkey) => {
            const action = recordingActionRef.current;

            setRecordingAction(null);

            if (!action || !hasNonModifierKey(hotkey)) {
                return;
            }

            const conflictingAction = findAppHotkeyConflict(
                action,
                hotkey,
                hotkeyBindings,
            );

            if (conflictingAction) {
                setStatusAction(action);
                setStatusMessage(
                    `${conflictingAction.label} already uses ${conflictingAction.shortcutLabel}.`,
                );
                return;
            }

            setHotkeyBinding(action, hotkey);
            clearStatus();
        },
        onCancel: () => {
            setRecordingAction(null);
        },
        onClear: () => {
            const action = recordingActionRef.current;

            setRecordingAction(null);

            if (!action || !getAppHotkeyDefinition(action).isEditable) {
                return;
            }

            resetHotkeyBinding(action);
            clearStatus();
        },
    });

    const handleStartRecording = (action: AppHotkeyAction): void => {
        if (!getAppHotkeyDefinition(action).isEditable) {
            return;
        }

        if (recorder.isRecording) {
            recorder.cancelRecording();
        }

        setRecordingAction(action);
        clearStatus();
        recorder.startRecording();
    };

    const handleCancelRecording = (): void => {
        recorder.cancelRecording();
    };

    const handleResetBinding = (action: AppHotkeyAction): void => {
        resetHotkeyBinding(action);
        clearStatus();
    };

    const handleResetAllBindings = (): void => {
        resetAllHotkeyBindings();
        clearStatus();
    };

    return (
        <div className="flex w-full flex-col divide-y divide-fumi-200/80">
            <div className="flex items-center justify-between gap-6 py-4">
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-fumi-900">
                        Keyboard shortcuts
                    </p>
                    <p className="mt-1 text-xs leading-[1.55] text-fumi-400">
                        Click a shortcut to record. Press Backspace to reset.
                        Native menu shortcuts stay fixed and are not listed
                        here.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleResetAllBindings}
                    disabled={!hasCustomBindings}
                    className="app-select-none inline-flex h-8 shrink-0 items-center justify-center rounded-[0.65rem] border border-fumi-200 bg-fumi-50 px-3 text-xs font-semibold text-fumi-700 transition-[background-color,border-color,color] hover:border-fumi-300 hover:bg-fumi-100 hover:text-fumi-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-2 focus-visible:ring-offset-fumi-50 disabled:cursor-default disabled:opacity-50"
                >
                    Reset all
                </button>
            </div>

            {groups.map(({ groupLabel, hotkeys }) => (
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
                                isRecording={
                                    recordingAction === hotkey.action &&
                                    recorder.isRecording
                                }
                                statusMessage={
                                    statusAction === hotkey.action
                                        ? statusMessage
                                        : null
                                }
                                lockedMessage={
                                    hotkey.isEditable
                                        ? null
                                        : "Fixed by native menu"
                                }
                                onStartRecording={handleStartRecording}
                                onCancelRecording={handleCancelRecording}
                                onReset={handleResetBinding}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
