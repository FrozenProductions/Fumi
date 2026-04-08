import type { AppHotkeyAction } from "../../../../lib/app/app.type";

export type AppSettingsHotkeyFieldProps = {
    action: AppHotkeyAction;
    label: string;
    shortcutLabel: string;
    isEditable: boolean;
    isCustomized: boolean;
    isRecording: boolean;
    statusMessage?: string | null;
    lockedMessage?: string | null;
    onStartRecording: (action: AppHotkeyAction) => void;
    onCancelRecording: () => void;
    onReset: (action: AppHotkeyAction) => void;
};
