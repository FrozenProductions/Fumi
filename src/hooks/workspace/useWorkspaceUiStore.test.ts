import { afterEach, describe, expect, it } from "vite-plus/test";
import { useWorkspaceUiStore } from "./useWorkspaceUiStore";

describe("useWorkspaceUiStore", () => {
    afterEach(() => {
        useWorkspaceUiStore.getState().resetWorkspaceUiState();
    });

    it("keeps the tab list dropdown scoped to a single tab bar", () => {
        const { openTabList, toggleTabList, closeTabList } =
            useWorkspaceUiStore.getState();

        openTabList("pane-a");
        expect(useWorkspaceUiStore.getState().tabListScopeId).toBe("pane-a");

        toggleTabList("pane-b");
        expect(useWorkspaceUiStore.getState().tabListScopeId).toBe("pane-b");

        closeTabList("pane-a");
        expect(useWorkspaceUiStore.getState().tabListScopeId).toBe("pane-b");

        closeTabList("pane-b");
        expect(useWorkspaceUiStore.getState().tabListScopeId).toBeNull();
    });
});
