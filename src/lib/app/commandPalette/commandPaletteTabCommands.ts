import { CommandIcon } from "@hugeicons/core-free-icons";
import type { AppCommandPaletteItem } from "../app.type";
import type { GetCommandPaletteCommandItemsOptions } from "./commandPalette.type";

type CommandPaletteTabOptions = Pick<
    GetCommandPaletteCommandItemsOptions,
    | "hotkeyLabels"
    | "onActivateGoToLineMode"
    | "onOpenWorkspaceScreen"
    | "onRequestRenameCurrentTab"
    | "workspaceExecutor"
    | "workspaceSession"
>;

export function getActiveTabCommandItems({
    hotkeyLabels,
    onActivateGoToLineMode,
    onOpenWorkspaceScreen,
    onRequestRenameCurrentTab,
    workspaceExecutor,
    workspaceSession,
}: CommandPaletteTabOptions): AppCommandPaletteItem[] {
    const { activeTab, workspace } = workspaceSession.state;

    if (!activeTab) {
        return [];
    }

    const {
        archiveWorkspaceTab,
        deleteWorkspaceTab,
        duplicateWorkspaceTab,
        focusWorkspacePane,
        openWorkspaceTabInPane,
        resetWorkspaceSplitView,
        saveActiveWorkspaceTab,
        toggleWorkspaceSplitView,
    } = workspaceSession.tabActions;
    const { executeActiveTab } = workspaceExecutor.actions;
    const executorState = workspaceExecutor.state;
    const splitView = workspace?.splitView ?? null;
    const items: AppCommandPaletteItem[] = [
        {
            id: "command-execute-tab",
            label: "Execute active tab",
            description: executorState.hasSupportedExecutor
                ? `Run ${activeTab.fileName} through the executor.`
                : "No supported executor detected.",
            icon: CommandIcon,
            keywords: `execute run script ${activeTab.fileName}`,
            isDisabled: !executorState.hasSupportedExecutor,
            onSelect: () => {
                void executeActiveTab();
            },
        },
        {
            id: "command-goto-line",
            label: "Go to line",
            description: `Jump to a specific line in ${activeTab.fileName}.`,
            icon: CommandIcon,
            meta: hotkeyLabels.activateGoToLine,
            keywords: `goto go to jump line ${activeTab.fileName} current tab`,
            closeOnSelect: false,
            onSelect: onActivateGoToLineMode,
        },
        {
            id: "command-save-tab",
            label: "Save current tab",
            description: `Write ${activeTab.fileName} to disk.`,
            icon: CommandIcon,
            keywords: `save write ${activeTab.fileName}`,
            onSelect: () => {
                void saveActiveWorkspaceTab();
            },
        },
        {
            id: "command-rename-tab",
            label: "Rename current tab",
            description: `Rename ${activeTab.fileName} in the tab bar.`,
            icon: CommandIcon,
            keywords: `rename edit file name ${activeTab.fileName}`,
            onSelect: () => {
                onOpenWorkspaceScreen();
                onRequestRenameCurrentTab();
            },
        },
        {
            id: "command-duplicate-tab",
            label: "Duplicate current tab",
            description: `Create a copy of ${activeTab.fileName}.`,
            icon: CommandIcon,
            keywords: `duplicate copy clone ${activeTab.fileName}`,
            onSelect: () => {
                onOpenWorkspaceScreen();
                void duplicateWorkspaceTab(activeTab.id);
            },
        },
        {
            id: "command-archive-tab",
            label: "Archive current tab",
            description: `Archive ${activeTab.fileName} from the tab bar.`,
            icon: CommandIcon,
            meta: hotkeyLabels.archiveWorkspaceTab,
            keywords: `archive close remove ${activeTab.fileName}`,
            onSelect: () => {
                void archiveWorkspaceTab(activeTab.id);
            },
        },
        {
            id: "command-delete-tab",
            label: "Delete current tab",
            description: `Permanently remove ${activeTab.fileName} from the workspace.`,
            icon: CommandIcon,
            keywords: `delete remove file ${activeTab.fileName}`,
            onSelect: () => {
                void deleteWorkspaceTab(activeTab.id);
            },
        },
        {
            id: "command-toggle-split-view",
            label: splitView ? "Toggle split view off" : "Toggle split view",
            description: splitView
                ? "Collapse the current split and return to a single editor pane."
                : `Open ${activeTab.fileName} in a two-pane split view.`,
            icon: CommandIcon,
            meta: hotkeyLabels.toggleWorkspaceSplitView,
            keywords: `split toggle pane editor ${activeTab.fileName}`,
            onSelect: () => {
                onOpenWorkspaceScreen();
                toggleWorkspaceSplitView();
            },
        },
        {
            id: "command-split-open-left",
            label: "Move current tab to left pane",
            description: `Place ${activeTab.fileName} in the left editor pane.`,
            icon: CommandIcon,
            meta: hotkeyLabels.moveWorkspaceTabToLeftPane,
            keywords: `split left pane editor view ${activeTab.fileName}`,
            onSelect: () => {
                onOpenWorkspaceScreen();
                openWorkspaceTabInPane(activeTab.id, "primary");
            },
        },
        {
            id: "command-split-open-right",
            label: "Move current tab to right pane",
            description: `Place ${activeTab.fileName} in the right editor pane.`,
            icon: CommandIcon,
            meta: hotkeyLabels.moveWorkspaceTabToRightPane,
            keywords: `split right pane editor view ${activeTab.fileName}`,
            onSelect: () => {
                onOpenWorkspaceScreen();
                openWorkspaceTabInPane(activeTab.id, "secondary");
            },
        },
    ];

    if (!splitView) {
        return items;
    }

    return [
        ...items,
        {
            id: "command-split-focus-left",
            label: "Focus left pane",
            description: "Move focus to the left editor pane.",
            icon: CommandIcon,
            keywords: "split left pane focus editor",
            isDisabled: splitView.focusedPane === "primary",
            meta:
                splitView.focusedPane === "primary"
                    ? "Current"
                    : hotkeyLabels.focusWorkspaceLeftPane,
            onSelect: () => {
                onOpenWorkspaceScreen();
                focusWorkspacePane("primary");
            },
        },
        {
            id: "command-split-focus-right",
            label: "Focus right pane",
            description: "Move focus to the right editor pane.",
            icon: CommandIcon,
            keywords: "split right pane focus editor",
            isDisabled: splitView.focusedPane === "secondary",
            meta:
                splitView.focusedPane === "secondary"
                    ? "Current"
                    : hotkeyLabels.focusWorkspaceRightPane,
            onSelect: () => {
                onOpenWorkspaceScreen();
                focusWorkspacePane("secondary");
            },
        },
        {
            id: "command-split-reset",
            label: "Reset split view",
            description: "Reset the split ratio back to an even 50/50 layout.",
            icon: CommandIcon,
            meta: hotkeyLabels.resetWorkspaceSplitView,
            keywords: "split reset ratio even equal panes editor",
            onSelect: () => {
                onOpenWorkspaceScreen();
                resetWorkspaceSplitView();
            },
        },
    ];
}
