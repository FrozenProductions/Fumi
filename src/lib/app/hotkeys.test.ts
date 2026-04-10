import { formatForDisplay } from "@tanstack/react-hotkeys";
import { describe, expect, it } from "vite-plus/test";
import {
    findAppHotkeyConflict,
    getAppHotkeyBinding,
    getAppHotkeySettingsActions,
    getResolvedAppHotkey,
    isAppHotkeyOverride,
    normalizeAppHotkeyBindings,
    shouldTriggerAppHotkeyCapture,
    shouldTriggerAppHotkeyCodeFallback,
} from "./hotkeys";

describe("normalizeAppHotkeyBindings", () => {
    it("keeps valid editable overrides and drops invalid or fixed actions", () => {
        expect(
            normalizeAppHotkeyBindings({
                OPEN_COMMAND_PALETTE: "Mod+K",
                TOGGLE_SIDEBAR: "Mod+B",
                OPEN_SETTINGS: "Mod+Shift+P",
                BAD_ACTION: "Mod+B",
                CREATE_WORKSPACE_FILE: "Shift",
            }),
        ).toEqual({
            OPEN_COMMAND_PALETTE: "Mod+K",
        });
    });
});

describe("isAppHotkeyOverride", () => {
    it("returns false when a binding matches the default shortcut", () => {
        expect(isAppHotkeyOverride("OPEN_COMMAND_PALETTE", "Mod+P")).toBe(
            false,
        );
    });
});

describe("findAppHotkeyConflict", () => {
    it("detects conflicts against editable shortcuts", () => {
        expect(
            findAppHotkeyConflict("OPEN_COMMAND_PALETTE", "Mod+B", {}),
        ).toEqual({
            label: "Toggle sidebar",
            shortcutLabel: formatForDisplay("Mod+B"),
        });
    });

    it("detects conflicts against fixed shortcuts", () => {
        expect(
            findAppHotkeyConflict("OPEN_COMMAND_PALETTE", "Mod+,", {}),
        ).toEqual({
            label: "Open settings",
            shortcutLabel: formatForDisplay("Mod+,"),
        });
    });

    it("detects conflicts against fixed native menu shortcuts", () => {
        expect(
            findAppHotkeyConflict("OPEN_COMMAND_PALETTE", "Mod+=", {}),
        ).toEqual({
            label: "Zoom in",
            shortcutLabel: formatForDisplay("Mod+="),
        });
    });

    it("detects conflicts against editable raw-object shortcuts", () => {
        expect(
            findAppHotkeyConflict(
                "OPEN_COMMAND_PALETTE",
                getAppHotkeyBinding("RESET_WORKSPACE_SPLIT_VIEW", {}),
                {},
            ),
        ).toEqual({
            label: "Reset split ratio",
            shortcutLabel: getResolvedAppHotkey(
                "RESET_WORKSPACE_SPLIT_VIEW",
                {},
            ).shortcutLabel,
        });
    });

    it("detects conflicts against reserved app shortcuts", () => {
        expect(
            findAppHotkeyConflict("OPEN_COMMAND_PALETTE", "Escape", {}),
        ).toEqual({
            label: "Close command palette or settings",
            shortcutLabel: formatForDisplay("Escape"),
        });
    });
});

describe("app hotkey resolution", () => {
    it("returns raw-object defaults for bindings that are not valid string hotkeys", () => {
        expect(getAppHotkeyBinding("ACTIVATE_GOTO_LINE_COMMAND", {})).toEqual({
            key: "\\",
            mod: true,
            shift: true,
        });
    });

    it("exposes settings actions without native-only shortcuts", () => {
        expect(getAppHotkeySettingsActions()).not.toContain("QUIT_APP");
        expect(getAppHotkeySettingsActions()).not.toContain("OPEN_SETTINGS");
    });

    it("formats resolved labels for display", () => {
        expect(
            getResolvedAppHotkey("OPEN_COMMAND_PALETTE", {
                OPEN_COMMAND_PALETTE: "Mod+K",
            }).shortcutLabel,
        ).toBeTruthy();
    });
});

describe("shouldTriggerAppHotkeyCodeFallback", () => {
    it("falls back to event.code when the physical key matches but the layout does not", () => {
        expect(
            shouldTriggerAppHotkeyCodeFallback(
                {
                    key: "з",
                    code: "KeyP",
                    ctrlKey: false,
                    shiftKey: false,
                    altKey: false,
                    metaKey: true,
                } as KeyboardEvent,
                {
                    key: "P",
                    meta: true,
                },
            ),
        ).toBe(true);
    });

    it("does not trigger the fallback when the logical matcher already succeeds", () => {
        expect(
            shouldTriggerAppHotkeyCodeFallback(
                {
                    key: "p",
                    code: "KeyP",
                    ctrlKey: false,
                    shiftKey: false,
                    altKey: false,
                    metaKey: true,
                } as KeyboardEvent,
                {
                    key: "P",
                    meta: true,
                },
            ),
        ).toBe(false);
    });
});

describe("shouldTriggerAppHotkeyCapture", () => {
    it("matches logical hotkeys during capture handling", () => {
        expect(
            shouldTriggerAppHotkeyCapture(
                {
                    key: "\\",
                    code: "Backslash",
                    ctrlKey: false,
                    shiftKey: false,
                    altKey: false,
                    metaKey: true,
                } as KeyboardEvent,
                {
                    key: "\\",
                    meta: true,
                },
            ),
        ).toBe(true);
    });

    it("matches physical keys when the keyboard layout changes the logical key", () => {
        expect(
            shouldTriggerAppHotkeyCapture(
                {
                    key: "з",
                    code: "KeyP",
                    ctrlKey: false,
                    shiftKey: false,
                    altKey: false,
                    metaKey: true,
                } as KeyboardEvent,
                {
                    key: "P",
                    meta: true,
                },
            ),
        ).toBe(true);
    });
});
