import { beforeEach, describe, expect, it } from "vite-plus/test";
import { useAppStore } from "./useAppStore";

describe("useAppStore renameCurrentTabRequest", () => {
    beforeEach(() => {
        useAppStore.setState({
            renameCurrentTabRequest: null,
            nextRenameCurrentTabRequestId: 0,
        });
    });

    it("increments request ids and clears the request", () => {
        useAppStore.getState().requestRenameCurrentTab();

        expect(useAppStore.getState().renameCurrentTabRequest).toEqual({
            requestId: 1,
        });

        useAppStore.getState().requestRenameCurrentTab();

        expect(useAppStore.getState().renameCurrentTabRequest).toEqual({
            requestId: 2,
        });

        useAppStore.getState().clearRenameCurrentTabRequest();

        expect(useAppStore.getState().renameCurrentTabRequest).toBeNull();
    });
});

describe("useAppStore hotkeyBindings", () => {
    beforeEach(() => {
        useAppStore.setState({
            hotkeyBindings: {},
        });
    });

    it("stores and resets per-action hotkey overrides", () => {
        useAppStore
            .getState()
            .setHotkeyBinding("OPEN_COMMAND_PALETTE", "Mod+K");

        expect(useAppStore.getState().hotkeyBindings).toEqual({
            OPEN_COMMAND_PALETTE: "Mod+K",
        });

        useAppStore.getState().resetHotkeyBinding("OPEN_COMMAND_PALETTE");

        expect(useAppStore.getState().hotkeyBindings).toEqual({});
    });

    it("does not store bindings that match the default shortcut", () => {
        useAppStore
            .getState()
            .setHotkeyBinding("OPEN_COMMAND_PALETTE", "Mod+P");

        expect(useAppStore.getState().hotkeyBindings).toEqual({});
    });

    it("clears an existing override when the default shortcut is restored", () => {
        useAppStore
            .getState()
            .setHotkeyBinding("OPEN_COMMAND_PALETTE", "Mod+K");
        useAppStore
            .getState()
            .setHotkeyBinding("OPEN_COMMAND_PALETTE", "Mod+P");

        expect(useAppStore.getState().hotkeyBindings).toEqual({});
    });

    it("clears all saved hotkey overrides", () => {
        useAppStore
            .getState()
            .setHotkeyBinding("OPEN_COMMAND_PALETTE", "Mod+K");
        useAppStore.getState().setHotkeyBinding("TOGGLE_SIDEBAR", "Mod+J");

        useAppStore.getState().resetAllHotkeyBindings();

        expect(useAppStore.getState().hotkeyBindings).toEqual({});
    });
});

describe("useAppStore editorSettings", () => {
    beforeEach(() => {
        useAppStore.setState((state) => ({
            editorSettings: {
                ...state.editorSettings,
                isOutlinePanelVisible: true,
                outlinePanelWidth: 256,
            },
        }));
    });

    it("toggles the outline panel visibility", () => {
        useAppStore.getState().toggleOutlinePanel();

        expect(
            useAppStore.getState().editorSettings.isOutlinePanelVisible,
        ).toBe(false);

        useAppStore.getState().toggleOutlinePanel();

        expect(
            useAppStore.getState().editorSettings.isOutlinePanelVisible,
        ).toBe(true);
    });

    it("stores outline panel width within the allowed bounds", () => {
        useAppStore.getState().setOutlinePanelWidth(320);

        expect(useAppStore.getState().editorSettings.outlinePanelWidth).toBe(
            320,
        );

        useAppStore.getState().setOutlinePanelWidth(100);

        expect(useAppStore.getState().editorSettings.outlinePanelWidth).toBe(
            200,
        );
    });
});
