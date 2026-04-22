import { useEffect } from "react";
import {
    shouldTriggerAppHotkeyCapture,
    shouldTriggerAppHotkeyCodeFallback,
} from "../../../lib/app/hotkeys/hotkeys";
import type { UseAppGlobalHotkeyCaptureOptions } from "./useAppHotkeys.type";

/**
 * Captures global keyboard events for app-level hotkeys outside the tanstack-hotkeys context.
 *
 * @remarks
 * Handles cases where tanstack-hotkeys may not capture events, providing a fallback
 * for core shortcuts like toggle sidebar, command palette, and settings.
 */
export function useAppGlobalHotkeyCapture({
    activeSidebarItem,
    isCommandPaletteOpen,
    activeTab,
    workspace,
    hotkeys,
    selectSidebarItem,
    toggleCommandPalette,
    toggleCommandPaletteScope,
    toggleGoToLineCommandPalette,
    toggleWorkspaceSplitView,
}: UseAppGlobalHotkeyCaptureOptions): void {
    useEffect(() => {
        const handleGlobalAppKeydown = (event: KeyboardEvent): void => {
            if (
                shouldTriggerAppHotkeyCapture(
                    event,
                    hotkeys.toggleWorkspaceSplitView,
                )
            ) {
                if (!isCommandPaletteOpen && workspace && activeTab) {
                    event.preventDefault();
                    event.stopPropagation();
                    selectSidebarItem("workspace");
                    toggleWorkspaceSplitView();
                }

                return;
            }

            if (
                shouldTriggerAppHotkeyCodeFallback(event, hotkeys.openSettings)
            ) {
                if (isCommandPaletteOpen) {
                    return;
                }

                event.preventDefault();
                event.stopPropagation();

                if (activeSidebarItem === "settings") {
                    selectSidebarItem("workspace");
                    return;
                }

                selectSidebarItem("settings");
                return;
            }

            if (
                shouldTriggerAppHotkeyCodeFallback(
                    event,
                    hotkeys.openCommandPalette,
                )
            ) {
                event.preventDefault();
                event.stopPropagation();
                toggleCommandPalette();
                return;
            }

            if (
                shouldTriggerAppHotkeyCodeFallback(
                    event,
                    hotkeys.commandPaletteCommands,
                )
            ) {
                if (!isCommandPaletteOpen) {
                    return;
                }

                event.preventDefault();
                event.stopPropagation();
                toggleCommandPaletteScope("commands");
                return;
            }

            if (
                shouldTriggerAppHotkeyCodeFallback(
                    event,
                    hotkeys.commandPaletteWorkspaces,
                )
            ) {
                if (!isCommandPaletteOpen) {
                    return;
                }

                event.preventDefault();
                event.stopPropagation();
                toggleCommandPaletteScope("workspaces");
                return;
            }

            if (!shouldTriggerAppHotkeyCodeFallback(event, hotkeys.goToLine)) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            toggleGoToLineCommandPalette();
        };

        window.addEventListener("keydown", handleGlobalAppKeydown, true);

        return () => {
            window.removeEventListener("keydown", handleGlobalAppKeydown, true);
        };
    }, [
        activeSidebarItem,
        activeTab,
        hotkeys.commandPaletteCommands,
        hotkeys.commandPaletteWorkspaces,
        hotkeys.goToLine,
        hotkeys.openCommandPalette,
        hotkeys.openSettings,
        hotkeys.toggleWorkspaceSplitView,
        isCommandPaletteOpen,
        selectSidebarItem,
        toggleCommandPalette,
        toggleCommandPaletteScope,
        toggleGoToLineCommandPalette,
        toggleWorkspaceSplitView,
        workspace,
    ]);
}
