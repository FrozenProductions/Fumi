import {
    formatHotkey,
    hasNonModifierKey,
    matchesKeyboardEvent,
    normalizeHotkey,
    parseHotkey,
    rawHotkeyToParsedHotkey,
} from "@tanstack/hotkeys";
import { formatForDisplay } from "@tanstack/react-hotkeys";
import {
    APP_HOTKEY_ACTIONS,
    APP_HOTKEY_DEFINITIONS,
    APP_RESERVED_APP_HOTKEYS,
    APP_RESERVED_NATIVE_MENU_HOTKEYS,
} from "../../constants/app/hotkeys";
import type {
    AppHotkeyAction,
    AppHotkeyBinding,
    AppHotkeyBindings,
} from "./app.type";
import type {
    AppHotkeyConflict,
    AppReservedHotkey,
    ResolvedAppHotkey,
} from "./hotkeys.type";

export function isAppHotkeyAction(value: unknown): value is AppHotkeyAction {
    return (
        typeof value === "string" &&
        APP_HOTKEY_ACTIONS.includes(value as AppHotkeyAction)
    );
}

export function isAppHotkeyBinding(value: unknown): value is AppHotkeyBinding {
    return typeof value === "string" && hasNonModifierKey(value);
}

export function normalizeAppHotkeyBindings(value: unknown): AppHotkeyBindings {
    if (!value || typeof value !== "object") {
        return {};
    }

    const entries = Object.entries(value as Record<string, unknown>).filter(
        ([action, binding]) =>
            isAppHotkeyAction(action) &&
            APP_HOTKEY_DEFINITIONS[action].isEditable &&
            isAppHotkeyBinding(binding) &&
            isAppHotkeyOverride(action, binding),
    );

    return Object.fromEntries(entries) as AppHotkeyBindings;
}

export function getAppHotkeyDefinition(
    action: AppHotkeyAction,
): (typeof APP_HOTKEY_DEFINITIONS)[AppHotkeyAction] {
    return APP_HOTKEY_DEFINITIONS[action];
}

export function getAppHotkeyBinding(
    action: AppHotkeyAction,
    hotkeyBindings: AppHotkeyBindings,
): AppHotkeyBinding {
    const definition = getAppHotkeyDefinition(action);

    if (!definition.isEditable) {
        return definition.defaultBinding;
    }

    return hotkeyBindings[action] ?? definition.defaultBinding;
}

export function getAppHotkeyShortcutLabel(
    action: AppHotkeyAction,
    hotkeyBindings: AppHotkeyBindings,
): string {
    const binding = getAppHotkeyBinding(action, hotkeyBindings);

    return formatForDisplay(
        typeof binding === "string"
            ? binding
            : rawHotkeyToParsedHotkey(binding),
    );
}

export function isAppHotkeyCustomized(
    action: AppHotkeyAction,
    hotkeyBindings: AppHotkeyBindings,
): boolean {
    const definition = getAppHotkeyDefinition(action);
    const binding = hotkeyBindings[action];

    if (!definition.isEditable || binding === undefined) {
        return false;
    }

    return isAppHotkeyOverride(action, binding);
}

export function getResolvedAppHotkey(
    action: AppHotkeyAction,
    hotkeyBindings: AppHotkeyBindings,
): ResolvedAppHotkey {
    const definition = getAppHotkeyDefinition(action);
    const binding = getAppHotkeyBinding(action, hotkeyBindings);

    return {
        action,
        ...definition,
        binding,
        shortcutLabel: getAppHotkeyShortcutLabel(action, hotkeyBindings),
        isCustomized: isAppHotkeyCustomized(action, hotkeyBindings),
    };
}

export function getAppHotkeySettingsActions(): AppHotkeyAction[] {
    return APP_HOTKEY_ACTIONS.filter(
        (action) => APP_HOTKEY_DEFINITIONS[action].isVisibleInSettings,
    );
}

export function getAppHotkeyGroups(hotkeyBindings: AppHotkeyBindings): Array<{
    groupLabel: string;
    hotkeys: ResolvedAppHotkey[];
}> {
    const groups = new Map<string, ResolvedAppHotkey[]>();

    for (const action of getAppHotkeySettingsActions()) {
        const hotkey = getResolvedAppHotkey(action, hotkeyBindings);
        const existingGroup = groups.get(hotkey.groupLabel);

        if (existingGroup) {
            existingGroup.push(hotkey);
            continue;
        }

        groups.set(hotkey.groupLabel, [hotkey]);
    }

    return Array.from(groups, ([groupLabel, hotkeys]) => ({
        groupLabel,
        hotkeys,
    }));
}

export function findAppHotkeyConflict(
    action: AppHotkeyAction,
    binding: AppHotkeyBinding,
    hotkeyBindings: AppHotkeyBindings,
): AppHotkeyConflict | null {
    const normalizedBinding = normalizeAppHotkeyBinding(binding);

    for (const currentAction of APP_HOTKEY_ACTIONS) {
        if (currentAction === action) {
            continue;
        }

        const currentBinding = getAppHotkeyBinding(
            currentAction,
            hotkeyBindings,
        );

        if (normalizeAppHotkeyBinding(currentBinding) === normalizedBinding) {
            const hotkey = getResolvedAppHotkey(currentAction, hotkeyBindings);

            return {
                label: hotkey.label,
                shortcutLabel: hotkey.shortcutLabel,
            };
        }
    }

    for (const reservedHotkey of [
        ...APP_RESERVED_APP_HOTKEYS,
        ...APP_RESERVED_NATIVE_MENU_HOTKEYS,
    ]) {
        if (
            normalizeAppHotkeyBinding(reservedHotkey.binding) ===
            normalizedBinding
        ) {
            return {
                label: reservedHotkey.label,
                shortcutLabel: getReservedHotkeyShortcutLabel(reservedHotkey),
            };
        }
    }

    return null;
}

export function isAppHotkeyOverride(
    action: AppHotkeyAction,
    binding: AppHotkeyBinding,
): boolean {
    const definition = getAppHotkeyDefinition(action);

    if (!definition.isEditable) {
        return false;
    }

    return (
        normalizeAppHotkeyBinding(binding) !==
        normalizeAppHotkeyBinding(definition.defaultBinding)
    );
}

export function shouldTriggerAppHotkeyCodeFallback(
    event: KeyboardEvent,
    binding: AppHotkeyBinding,
): boolean {
    const parsedBinding = parseAppHotkeyBinding(binding);
    const code = getHotkeyKeyCode(parsedBinding.key);

    if (!code) {
        return false;
    }

    return (
        event.code === code &&
        event.ctrlKey === parsedBinding.ctrl &&
        event.shiftKey === parsedBinding.shift &&
        event.altKey === parsedBinding.alt &&
        event.metaKey === parsedBinding.meta &&
        !matchesKeyboardEvent(event, parsedBinding)
    );
}

function getReservedHotkeyShortcutLabel(hotkey: AppReservedHotkey): string {
    return formatForDisplay(hotkey.binding);
}

function parseAppHotkeyBinding(binding: AppHotkeyBinding) {
    if (typeof binding === "string") {
        return parseHotkey(binding);
    }

    return rawHotkeyToParsedHotkey(binding);
}

function getHotkeyKeyCode(key: string): string | null {
    if (/^[A-Z]$/i.test(key)) {
        return `Key${key.toUpperCase()}`;
    }

    if (/^[0-9]$/.test(key)) {
        return `Digit${key}`;
    }

    if (key in HOTKEY_KEY_CODE_MAP) {
        return HOTKEY_KEY_CODE_MAP[key as keyof typeof HOTKEY_KEY_CODE_MAP];
    }

    return null;
}

function normalizeAppHotkeyBinding(binding: AppHotkeyBinding): string {
    if (typeof binding === "string") {
        return normalizeHotkey(binding);
    }

    return formatHotkey(rawHotkeyToParsedHotkey(binding));
}

const HOTKEY_KEY_CODE_MAP = {
    "`": "Backquote",
    "-": "Minus",
    "=": "Equal",
    "[": "BracketLeft",
    "]": "BracketRight",
    "\\": "Backslash",
    ";": "Semicolon",
    "'": "Quote",
    ",": "Comma",
    ".": "Period",
    "/": "Slash",
} as const satisfies Record<string, string>;
