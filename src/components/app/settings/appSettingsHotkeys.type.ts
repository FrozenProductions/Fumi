import type { AppHotkeyAction } from "../../../lib/app/hotkeys/hotkeys.type";

export type AppSettingsHotkeyFieldProps = {
    action: AppHotkeyAction;
    label: string;
    shortcutLabel: string;
    isEditable: boolean;
    isCustomized: boolean;
    isDisabled: boolean;
    isRecording: boolean;
    statusMessage?: string | null;
    lockedMessage?: string | null;
    onStartRecording: (action: AppHotkeyAction) => void;
    onCancelRecording: () => void;
    onReset: (action: AppHotkeyAction) => void;
    onDisable: (action: AppHotkeyAction) => void;
    onEnable: (action: AppHotkeyAction) => void;
};
