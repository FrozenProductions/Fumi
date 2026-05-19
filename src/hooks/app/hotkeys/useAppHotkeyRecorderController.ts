import { hasNonModifierKey } from "@tanstack/hotkeys";
import { useHotkeyRecorder } from "@tanstack/react-hotkeys";
import { useEffect, useRef, useState } from "react";
import {
    findAppHotkeyConflict,
    getAppHotkeyDefinition,
    getAppHotkeyGroups,
} from "../../../lib/app/hotkeys/hotkeys";
import type { AppHotkeyAction } from "../../../lib/app/hotkeys/hotkeys.type";
import { useAppStore } from "../useAppStore";

type UseAppHotkeyRecorderControllerResult = {
    groups: ReturnType<typeof getAppHotkeyGroups>;
    hasCustomBindings: boolean;
    isRecording: boolean;
    recordingAction: AppHotkeyAction | null;
    statusAction: AppHotkeyAction | null;
    statusMessage: string | null;
    onCancelRecording: () => void;
    onResetAllBindings: () => void;
    onResetBinding: (action: AppHotkeyAction) => void;
    onStartRecording: (action: AppHotkeyAction) => void;
    onDisableBinding: (action: AppHotkeyAction) => void;
    onEnableBinding: (action: AppHotkeyAction) => void;
};

/**
 * Manages hotkey recording state, conflict detection, and binding updates.
 *
 * Integrates with the hotkey recorder to capture key combinations, detects
 * conflicts with existing bindings, and provides status feedback. Supports
 * disabling keybinds via Backspace and resetting individual or all bindings.
 *
 * @returns Recording state, status messages, hotkey groups, and action handlers
 */
export function useAppHotkeyRecorderController(): UseAppHotkeyRecorderControllerResult {
    const hotkeyBindings = useAppStore((state) => state.hotkeyBindings);
    const disabledHotkeys = useAppStore((state) => state.disabledHotkeys);
    const setHotkeyBinding = useAppStore((state) => state.setHotkeyBinding);
    const resetHotkeyBinding = useAppStore((state) => state.resetHotkeyBinding);
    const resetAllHotkeyBindings = useAppStore(
        (state) => state.resetAllHotkeyBindings,
    );
    const disableHotkeyBinding = useAppStore(
        (state) => state.disableHotkeyBinding,
    );
    const enableHotkeyBinding = useAppStore(
        (state) => state.enableHotkeyBinding,
    );
    const [recordingAction, setRecordingAction] =
        useState<AppHotkeyAction | null>(null);
    const [statusAction, setStatusAction] = useState<AppHotkeyAction | null>(
        null,
    );
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const recordingActionRef = useRef<AppHotkeyAction | null>(null);
    const statusTimeoutRef = useRef<number | null>(null);
    const groups = getAppHotkeyGroups(hotkeyBindings, disabledHotkeys);
    const hasCustomBindings =
        Object.keys(hotkeyBindings).length > 0 || disabledHotkeys.length > 0;

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

    function clearStatus(): void {
        if (statusTimeoutRef.current !== null) {
            window.clearTimeout(statusTimeoutRef.current);
            statusTimeoutRef.current = null;
        }

        setStatusAction(null);
        setStatusMessage(null);
    }

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
                disabledHotkeys,
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

            disableHotkeyBinding(action);
            clearStatus();
        },
    });

    function handleStartRecording(action: AppHotkeyAction): void {
        if (!getAppHotkeyDefinition(action).isEditable) {
            return;
        }

        if (recorder.isRecording) {
            recorder.cancelRecording();
        }

        setRecordingAction(action);
        clearStatus();
        recorder.startRecording();
    }

    function handleCancelRecording(): void {
        recorder.cancelRecording();
    }

    function handleResetBinding(action: AppHotkeyAction): void {
        resetHotkeyBinding(action);
        clearStatus();
    }

    function handleResetAllBindings(): void {
        resetAllHotkeyBindings();
        clearStatus();
    }

    function handleDisableBinding(action: AppHotkeyAction): void {
        disableHotkeyBinding(action);
        clearStatus();
    }

    function handleEnableBinding(action: AppHotkeyAction): void {
        enableHotkeyBinding(action);
        clearStatus();
    }

    return {
        groups,
        hasCustomBindings,
        isRecording: recorder.isRecording,
        recordingAction,
        statusAction,
        statusMessage,
        onCancelRecording: handleCancelRecording,
        onResetAllBindings: handleResetAllBindings,
        onResetBinding: handleResetBinding,
        onStartRecording: handleStartRecording,
        onDisableBinding: handleDisableBinding,
        onEnableBinding: handleEnableBinding,
    };
}
