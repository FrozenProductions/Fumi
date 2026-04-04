import { useHotkey } from "@tanstack/react-hotkeys";
import { type ReactElement, type ReactNode, useEffect } from "react";
import { APP_HOTKEYS } from "../../constants/app/hotkeys";
import { useAppStore } from "../../hooks/app/useAppStore";
import type { UseWorkspaceSessionResult } from "../../lib/workspace/workspace.type";

type AppHotkeysProviderProps = {
    workspaceSession: UseWorkspaceSessionResult;
    children: ReactNode;
};

export function AppHotkeysProvider({
    children,
    workspaceSession,
}: AppHotkeysProviderProps): ReactElement {
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

    useEffect(() => {
        const handleGlobalAppKeydown = (event: KeyboardEvent): void => {
            const isModifierPressed = event.metaKey || event.ctrlKey;

            if (!isModifierPressed) {
                return;
            }

            if (event.code === "Comma" && !isCommandPaletteOpen) {
                event.preventDefault();
                event.stopPropagation();
                if (activeSidebarItem === "settings") {
                    selectSidebarItem("workspace");
                } else {
                    selectSidebarItem("settings");
                }
                return;
            }

            if (event.code === "KeyP") {
                event.preventDefault();
                event.stopPropagation();
                toggleCommandPalette();
                return;
            }

            if (event.code === "Digit1") {
                if (!isCommandPaletteOpen) {
                    return;
                }

                event.preventDefault();
                event.stopPropagation();
                toggleCommandPaletteScope("commands");
                return;
            }

            if (event.code === "Digit2") {
                if (!isCommandPaletteOpen) {
                    return;
                }

                event.preventDefault();
                event.stopPropagation();
                toggleCommandPaletteScope("workspaces");
                return;
            }

            if (event.code === "Backslash" && event.shiftKey) {
                event.preventDefault();
                event.stopPropagation();
                toggleGoToLineCommandPalette();
            }
        };

        window.addEventListener("keydown", handleGlobalAppKeydown, true);

        return () => {
            window.removeEventListener("keydown", handleGlobalAppKeydown, true);
        };
    }, [
        isCommandPaletteOpen,
        toggleCommandPalette,
        toggleCommandPaletteScope,
        toggleGoToLineCommandPalette,
        activeSidebarItem,
        selectSidebarItem,
    ]);

    useHotkey(
        APP_HOTKEYS.OPEN_WORKSPACE_DIRECTORY.binding,
        () => {
            void workspaceSession.openWorkspaceDirectory();
        },
        {
            enabled: !isCommandPaletteOpen,
        },
    );

    useHotkey(
        APP_HOTKEYS.TOGGLE_SIDEBAR.binding,
        () => {
            toggleSidebar();
        },
        {
            enabled: !isCommandPaletteOpen,
        },
    );

    useHotkey(
        APP_HOTKEYS.OPEN_WORKSPACE_SCREEN.binding,
        () => {
            selectSidebarItem("workspace");
        },
        {
            enabled: !isCommandPaletteOpen,
        },
    );

    useHotkey(
        APP_HOTKEYS.OPEN_SCRIPT_LIBRARY.binding,
        () => {
            selectSidebarItem("script-library");
        },
        {
            enabled: !isCommandPaletteOpen,
        },
    );

    useHotkey(
        "Escape",
        () => {
            if (isCommandPaletteOpen) {
                closeCommandPalette();
                return;
            }

            if (activeSidebarItem === "settings") {
                selectSidebarItem("workspace");
            }
        },
        {
            enabled: isCommandPaletteOpen || activeSidebarItem === "settings",
        },
    );

    useHotkey(
        APP_HOTKEYS.CREATE_WORKSPACE_FILE.binding,
        () => {
            void workspaceSession.createWorkspaceFile();
        },
        {
            enabled:
                !isCommandPaletteOpen &&
                activeSidebarItem === "workspace" &&
                Boolean(workspaceSession.workspace),
        },
    );

    useHotkey(
        APP_HOTKEYS.ARCHIVE_WORKSPACE_TAB.binding,
        () => {
            const activeTabId = workspaceSession.activeTab?.id;

            if (!activeTabId) {
                return;
            }

            void workspaceSession.archiveWorkspaceTab(activeTabId);
        },
        {
            enabled:
                !isCommandPaletteOpen &&
                activeSidebarItem === "workspace" &&
                Boolean(workspaceSession.workspace) &&
                Boolean(workspaceSession.activeTab),
        },
    );

    return <>{children}</>;
}
