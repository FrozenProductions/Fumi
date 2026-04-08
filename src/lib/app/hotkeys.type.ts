import type { AppHotkeyAction, AppHotkeyBinding } from "./app.type";

export type AppHotkeyDefinition = {
    label: string;
    description: string;
    defaultBinding: AppHotkeyBinding;
    groupLabel: string;
    isEditable: boolean;
    isVisibleInSettings: boolean;
};

export type ResolvedAppHotkey = AppHotkeyDefinition & {
    action: AppHotkeyAction;
    binding: AppHotkeyBinding;
    shortcutLabel: string;
    isCustomized: boolean;
};

export type AppReservedHotkey = {
    label: string;
    binding: string;
};

export type AppHotkeyConflict = {
    label: string;
    shortcutLabel: string;
};
