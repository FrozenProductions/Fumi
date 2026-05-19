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
    HOTKEY_KEY_CODE_MAP,
} from "../../../constants/app/hotkeys";
import { isRecord, isStringLiteral } from "../../shared/validation";
import type {
    AppHotkeyAction,
    AppHotkeyBinding,
    AppHotkeyBindings,
    AppHotkeyConflict,
    AppReservedHotkey,
    ResolvedAppHotkey,
} from "./hotkeys.type";

function isAppHotkeyAction(value: unknown): value is AppHotkeyAction {
    return isStringLiteral(value, APP_HOTKEY_ACTIONS);
}

function isAppHotkeyBinding(value: unknown): value is AppHotkeyBinding {
    return typeof value === "string" && hasNonModifierKey(value);
}

/**
 * Filters and normalizes persisted hotkey bindings, keeping only editable overrides.
 */
export function normalizeAppHotkeyBindings(value: unknown): AppHotkeyBindings {
    if (!isRecord(value)) {
        return {};
    }

    const hotkeyBindings: AppHotkeyBindings = {};

    for (const [action, binding] of Object.entries(value)) {
        if (
            isAppHotkeyAction(action) &&
            APP_HOTKEY_DEFINITIONS[action].isEditable &&
            isAppHotkeyBinding(binding) &&
            isAppHotkeyOverride(action, binding)
        ) {
            hotkeyBindings[action] = binding;
        }
    }

    return hotkeyBindings;
}

/**
 * Retrieves the static definition (label, default binding, group) for a hotkey action.
 *
 * @param action - The hotkey action to look up
 * @returns The definition object for the given action
 */
export function getAppHotkeyDefinition(
    action: AppHotkeyAction,
): (typeof APP_HOTKEY_DEFINITIONS)[AppHotkeyAction] {
    return APP_HOTKEY_DEFINITIONS[action];
}

/**
 * Resolves the effective key binding for a hotkey action, falling back to the default if not customized.
 *
 * @param action - The hotkey action to resolve
 * @param hotkeyBindings - Persisted user overrides
 * @returns The active binding for the action
 */
export function getAppHotkeyBinding(
    action: AppHotkeyAction,
    hotkeyBindings: AppHotkeyBindings,
    disabledHotkeys: AppHotkeyAction[] = [],
): AppHotkeyBinding | null {
    const definition = getAppHotkeyDefinition(action);

    if (!definition.isEditable) {
        return definition.defaultBinding;
    }

    if (disabledHotkeys.includes(action)) {
        return null;
    }

    return hotkeyBindings[action] ?? definition.defaultBinding;
}

/**
 * Returns the display label for a hotkey action's current key binding.
 */
export function getAppHotkeyShortcutLabel(
    action: AppHotkeyAction,
    hotkeyBindings: AppHotkeyBindings,
    disabledHotkeys: AppHotkeyAction[] = [],
): string {
    const binding = getAppHotkeyBinding(
        action,
        hotkeyBindings,
        disabledHotkeys,
    );

    if (binding === null) {
        return "Disabled";
    }

    return formatForDisplay(
        typeof binding === "string"
            ? binding
            : rawHotkeyToParsedHotkey(binding),
    );
}

/**
 * Checks whether a hotkey action has been customized from its default binding.
 *
 * @param action - The hotkey action to check
 * @param hotkeyBindings - Persisted user overrides
 * @returns True if the user has set a non-default binding for this action
 */
function isAppHotkeyCustomized(
    action: AppHotkeyAction,
    hotkeyBindings: AppHotkeyBindings,
    disabledHotkeys: AppHotkeyAction[] = [],
): boolean {
    const definition = getAppHotkeyDefinition(action);

    if (!definition.isEditable) {
        return false;
    }

    if (disabledHotkeys.includes(action)) {
        return true;
    }

    const binding = hotkeyBindings[action];

    if (binding === undefined) {
        return false;
    }

    return isAppHotkeyOverride(action, binding);
}

/**
 * Resolves a hotkey action into its full definition including label, binding, and customization state.
 */
export function getResolvedAppHotkey(
    action: AppHotkeyAction,
    hotkeyBindings: AppHotkeyBindings,
    disabledHotkeys: AppHotkeyAction[] = [],
): ResolvedAppHotkey {
    const definition = getAppHotkeyDefinition(action);
    const binding = getAppHotkeyBinding(
        action,
        hotkeyBindings,
        disabledHotkeys,
    );

    return {
        action,
        ...definition,
        binding,
        shortcutLabel: getAppHotkeyShortcutLabel(
            action,
            hotkeyBindings,
            disabledHotkeys,
        ),
        isCustomized: isAppHotkeyCustomized(
            action,
            hotkeyBindings,
            disabledHotkeys,
        ),
        isDisabled: disabledHotkeys.includes(action),
    };
}

/**
 * Returns hotkey actions that should appear in the settings UI.
 *
 * @returns Filtered list of actions marked as visible in settings
 */
export function getAppHotkeySettingsActions(): AppHotkeyAction[] {
    return APP_HOTKEY_ACTIONS.filter(
        (action) => APP_HOTKEY_DEFINITIONS[action].isVisibleInSettings,
    );
}

/**
 * Groups resolved hotkeys by their group label for display in the settings panel.
 *
 * @param hotkeyBindings - Persisted user overrides
 * @returns Array of groups, each containing a label and its resolved hotkeys
 */
export function getAppHotkeyGroups(
    hotkeyBindings: AppHotkeyBindings,
    disabledHotkeys: AppHotkeyAction[] = [],
): Array<{
    groupLabel: string;
    hotkeys: ResolvedAppHotkey[];
}> {
    const groups = new Map<string, ResolvedAppHotkey[]>();

    for (const action of getAppHotkeySettingsActions()) {
        const hotkey = getResolvedAppHotkey(
            action,
            hotkeyBindings,
            disabledHotkeys,
        );
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

/**
 * Finds a conflicting hotkey binding for the given action and binding, or null if none.
 */
export function findAppHotkeyConflict(
    action: AppHotkeyAction,
    binding: AppHotkeyBinding,
    hotkeyBindings: AppHotkeyBindings,
    disabledHotkeys: AppHotkeyAction[] = [],
): AppHotkeyConflict | null {
    const normalizedBinding = normalizeAppHotkeyBinding(binding);

    for (const currentAction of APP_HOTKEY_ACTIONS) {
        if (currentAction === action) {
            continue;
        }

        if (disabledHotkeys.includes(currentAction)) {
            continue;
        }

        const currentBinding = getAppHotkeyBinding(
            currentAction,
            hotkeyBindings,
            disabledHotkeys,
        );

        if (currentBinding === null) {
            continue;
        }

        if (normalizeAppHotkeyBinding(currentBinding) === normalizedBinding) {
            const hotkey = getResolvedAppHotkey(
                currentAction,
                hotkeyBindings,
                disabledHotkeys,
            );

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

/**
 * Determines whether a binding differs from the action's default after normalization.
 *
 * @param action - The hotkey action to compare
 * @param binding - The binding to check
 * @returns True if the binding is a non-default override
 */
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

/**
 * Returns whether a keyboard event matches a hotkey binding via code fallback when key matching fails.
 */
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

/**
 * Returns whether a keyboard event should trigger hotkey capture, including code-based fallback.
 */
export function shouldTriggerAppHotkeyCapture(
    event: KeyboardEvent,
    binding: AppHotkeyBinding,
): boolean {
    const parsedBinding = parseAppHotkeyBinding(binding);

    return (
        matchesKeyboardEvent(event, parsedBinding) ||
        shouldTriggerAppHotkeyCodeFallback(event, binding)
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
