import type { ReactElement } from "react";
import { useAppGlobalHotkeyCapture } from "../../hooks/app/useAppGlobalHotkeyCapture";
import { useAppScopedHotkeys } from "../../hooks/app/useAppScopedHotkeys";
import { useAppStore } from "../../hooks/app/useAppStore";
import { useResolvedAppHotkeyBindings } from "../../hooks/app/useResolvedAppHotkeyBindings";
import { useWorkspaceSession } from "../../hooks/workspace/useWorkspaceSession";
import type { AppHotkeysProviderProps } from "./appHotkeysProvider.type";

/**
 * Provides app-wide hotkey handling for keyboard shortcuts.
 *
 * @remarks
 * Combines global hotkey capture (for fallback when tanstack-hotkeys misses events)
 * and scoped hotkeys (for workspace-specific actions). Registers both layers to ensure
 * reliable hotkey response across different contexts.
 */
export function AppHotkeysProvider({
    children,
}: AppHotkeysProviderProps): ReactElement {
    const workspaceSession = useWorkspaceSession();
    const { activeTab, workspace } = workspaceSession.state;
    const { createWorkspaceFile, openWorkspaceDirectory } =
        workspaceSession.workspaceActions;
    const {
        archiveWorkspaceTab,
        focusWorkspacePane,
        openWorkspaceTabInPane,
        resetWorkspaceSplitView,
        toggleWorkspaceSplitView,
    } = workspaceSession.tabActions;
    const activeSidebarItem = useAppStore((state) => state.activeSidebarItem);
    const isCommandPaletteOpen = useAppStore(
        (state) => state.isCommandPaletteOpen,
    );
    const closeCommandPalette = useAppStore(
        (state) => state.closeCommandPalette,
    );
    const toggleCommandPaletteScope = useAppStore(
        (state) => state.toggleCommandPaletteScope,
    );
    const toggleGoToLineCommandPalette = useAppStore(
        (state) => state.toggleGoToLineCommandPalette,
    );
    const toggleSidebar = useAppStore((state) => state.toggleSidebar);
    const selectSidebarItem = useAppStore((state) => state.selectSidebarItem);
    const toggleCommandPalette = useAppStore(
        (state) => state.toggleCommandPalette,
    );
    const hotkeys = useResolvedAppHotkeyBindings();

    useAppGlobalHotkeyCapture({
        activeSidebarItem,
        activeTab,
        workspace,
        isCommandPaletteOpen,
        hotkeys,
        selectSidebarItem,
        toggleCommandPalette,
        toggleCommandPaletteScope,
        toggleGoToLineCommandPalette,
        toggleWorkspaceSplitView,
    });

    useAppScopedHotkeys({
        activeSidebarItem,
        isCommandPaletteOpen,
        activeTab,
        workspace,
        hotkeys,
        closeCommandPalette,
        selectSidebarItem,
        toggleCommandPalette,
        toggleCommandPaletteScope,
        toggleGoToLineCommandPalette,
        toggleSidebar,
        createWorkspaceFile,
        openWorkspaceDirectory,
        archiveWorkspaceTab,
        openWorkspaceTabInPane,
        resetWorkspaceSplitView,
        toggleWorkspaceSplitView,
        focusWorkspacePane,
    });

    return <>{children}</>;
}
