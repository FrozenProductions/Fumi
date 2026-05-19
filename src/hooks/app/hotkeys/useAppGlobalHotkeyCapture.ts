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
    toggleExecutorConnection,
    executeActiveTab,
    hasSupportedExecutor,
    isExecutorAttached,
    isExecutorBusy,
}: UseAppGlobalHotkeyCaptureOptions): void {
    useEffect(() => {
        const handleGlobalAppKeydown = (event: KeyboardEvent): void => {
            if (
                hotkeys.toggleWorkspaceSplitView !== null &&
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
                hotkeys.executeActiveTab !== null &&
                shouldTriggerAppHotkeyCapture(event, hotkeys.executeActiveTab)
            ) {
                if (
                    isCommandPaletteOpen ||
                    !activeTab ||
                    !workspace ||
                    !hasSupportedExecutor ||
                    !isExecutorAttached ||
                    isExecutorBusy
                ) {
                    return;
                }

                event.preventDefault();
                event.stopPropagation();
                void executeActiveTab();
                return;
            }

            if (
                hotkeys.toggleExecutorConnection !== null &&
                shouldTriggerAppHotkeyCodeFallback(
                    event,
                    hotkeys.toggleExecutorConnection,
                )
            ) {
                if (isCommandPaletteOpen) {
                    return;
                }

                event.preventDefault();
                event.stopPropagation();
                selectSidebarItem("workspace");
                void toggleExecutorConnection();
                return;
            }

            if (
                hotkeys.openSettings !== null &&
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
                hotkeys.openCommandPalette !== null &&
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
                hotkeys.commandPaletteCommands !== null &&
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
                hotkeys.commandPaletteWorkspaces !== null &&
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

            if (hotkeys.goToLine === null) {
                return;
            }

            if (!shouldTriggerAppHotkeyCapture(event, hotkeys.goToLine)) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            toggleGoToLineCommandPalette();
        };

        window.addEventListener("keydown", handleGlobalAppKeydown, true);

        return () => {
            window.removeEventListener("keydown", handleGlobalAppKeydown, true);
        };
    }, [
        activeSidebarItem,
        activeTab,
        executeActiveTab,
        hasSupportedExecutor,
        hotkeys.commandPaletteCommands,
        hotkeys.commandPaletteWorkspaces,
        hotkeys.executeActiveTab,
        hotkeys.goToLine,
        hotkeys.openCommandPalette,
        hotkeys.openSettings,
        hotkeys.toggleExecutorConnection,
        hotkeys.toggleWorkspaceSplitView,
        isCommandPaletteOpen,
        isExecutorAttached,
        isExecutorBusy,
        selectSidebarItem,
        toggleCommandPalette,
        toggleCommandPaletteScope,
        toggleGoToLineCommandPalette,
        toggleExecutorConnection,
        toggleWorkspaceSplitView,
        workspace,
    ]);
}
