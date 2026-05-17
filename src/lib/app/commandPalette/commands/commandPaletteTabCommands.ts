import { CommandIcon } from "@hugeicons/core-free-icons";
import { isLuauFileName } from "../../../luau/fileType";
import { formatLuauScript } from "../../../platform/core/luau";
import { getErrorMessage } from "../../../shared/errorMessage";
import {
    getLiveWorkspaceEditorContent,
    setLiveWorkspaceEditorContent,
} from "../../../workspace/editor/liveWorkspaceEditorContent";
import type { GetCommandPaletteCommandItemsOptions } from "../commandPalette.type";
import type { AppCommandPaletteItem } from "../commandPaletteDomain.type";

type CommandPaletteTabOptions = Pick<
    GetCommandPaletteCommandItemsOptions,
    | "hotkeyLabels"
    | "onActivateGoToLineMode"
    | "onActivateSymbolMode"
    | "onOpenWorkspaceScreen"
    | "onRequestRenameCurrentTab"
    | "workspaceExecutor"
    | "workspaceSession"
>;

/** Builds command palette items for actions on the active tab such as execute, save, rename, and split view. */
export function getActiveTabCommandItems({
    hotkeyLabels,
    onActivateGoToLineMode,
    onActivateSymbolMode,
    onOpenWorkspaceScreen,
    onRequestRenameCurrentTab,
    workspaceExecutor,
    workspaceSession,
}: CommandPaletteTabOptions): AppCommandPaletteItem[] {
    const { activeTab, workspace } = workspaceSession.state;

    if (!activeTab) {
        return [];
    }

    const { clearErrorMessage, setErrorMessage, updateWorkspaceTabContent } =
        workspaceSession.editorActions;
    const {
        archiveWorkspaceTab,
        deleteWorkspaceTab,
        duplicateWorkspaceTab,
        focusWorkspacePane,
        resetWorkspaceSplitView,
        saveActiveWorkspaceTab,
        splitWorkspaceTab,
        toggleWorkspaceTabPinned,
        toggleWorkspaceSplitView,
    } = workspaceSession.tabActions;
    const { executeActiveTab } = workspaceExecutor.actions;
    const executorState = workspaceExecutor.state;
    const splitView = workspace?.splitView ?? null;
    const executeDescription = getExecuteActiveTabDescription(
        activeTab.fileName,
        executorState,
    );
    const canBeautifyActiveTab = isLuauFileName(activeTab.fileName);
    const items: AppCommandPaletteItem[] = [
        {
            id: "command-execute-tab",
            label: "Execute active tab",
            description: executeDescription,
            icon: CommandIcon,
            meta: hotkeyLabels.executeActiveTab,
            keywords: `execute run script ${activeTab.fileName}`,
            isDisabled:
                !executorState.hasSupportedExecutor ||
                !executorState.isAttached ||
                executorState.isBusy,
            onSelect: () => {
                void executeActiveTab();
            },
        },
        {
            id: "command-beautify-tab",
            label: "Beautify current tab",
            description: canBeautifyActiveTab
                ? `Format ${activeTab.fileName} with the Luau beautifier.`
                : "Only .lua and .luau tabs can be beautified.",
            icon: CommandIcon,
            keywords: `beautify format formatter pretty print luau lua ${activeTab.fileName}`,
            isDisabled: !canBeautifyActiveTab,
            onSelect: () => {
                onOpenWorkspaceScreen();
                void beautifyActiveTab({
                    activeTabId: activeTab.id,
                    content:
                        getLiveWorkspaceEditorContent(activeTab.id) ??
                        activeTab.content,
                    fileName: activeTab.fileName,
                    onClearErrorMessage: clearErrorMessage,
                    onSetErrorMessage: setErrorMessage,
                    onUpdateWorkspaceTabContent: updateWorkspaceTabContent,
                });
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
            id: "command-goto-symbol",
            label: "Go to Symbol",
            description: `Jump to a function or variable in ${activeTab.fileName}.`,
            icon: CommandIcon,
            keywords: `goto go to jump symbol function variable outline ${activeTab.fileName} current tab`,
            closeOnSelect: false,
            onSelect: onActivateSymbolMode,
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
            id: "command-toggle-pin-tab",
            label: activeTab.isPinned ? "Unpin current tab" : "Pin current tab",
            description: activeTab.isPinned
                ? `Allow ${activeTab.fileName} to be archived again.`
                : `Keep ${activeTab.fileName} from being archived.`,
            icon: CommandIcon,
            keywords: `pin pinned unpin keep ${activeTab.fileName}`,
            onSelect: () => {
                toggleWorkspaceTabPinned(activeTab.id);
            },
        },
        {
            id: "command-archive-tab",
            label: "Archive current tab",
            description: `Archive ${activeTab.fileName} from the tab bar.`,
            icon: CommandIcon,
            meta: hotkeyLabels.archiveWorkspaceTab,
            keywords: `archive close remove ${activeTab.fileName}`,
            isDisabled: activeTab.isPinned,
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
            label: "Split current tab left",
            description: `Split ${activeTab.fileName} to the left.`,
            icon: CommandIcon,
            meta: hotkeyLabels.moveWorkspaceTabToLeftPane,
            keywords: `split left pane editor view ${activeTab.fileName}`,
            onSelect: () => {
                onOpenWorkspaceScreen();
                splitWorkspaceTab(
                    activeTab.id,
                    splitView?.activePaneId ?? null,
                    "left",
                );
            },
        },
        {
            id: "command-split-open-right",
            label: "Split current tab right",
            description: `Split ${activeTab.fileName} to the right.`,
            icon: CommandIcon,
            meta: hotkeyLabels.moveWorkspaceTabToRightPane,
            keywords: `split right pane editor view ${activeTab.fileName}`,
            onSelect: () => {
                onOpenWorkspaceScreen();
                splitWorkspaceTab(
                    activeTab.id,
                    splitView?.activePaneId ?? null,
                    "right",
                );
            },
        },
        {
            id: "command-split-open-top",
            label: "Split current tab top",
            description: `Split ${activeTab.fileName} to the top.`,
            icon: CommandIcon,
            keywords: `split top pane editor view ${activeTab.fileName}`,
            onSelect: () => {
                onOpenWorkspaceScreen();
                splitWorkspaceTab(
                    activeTab.id,
                    splitView?.activePaneId ?? null,
                    "top",
                );
            },
        },
        {
            id: "command-split-open-bottom",
            label: "Split current tab bottom",
            description: `Split ${activeTab.fileName} to the bottom.`,
            icon: CommandIcon,
            keywords: `split bottom pane editor view ${activeTab.fileName}`,
            onSelect: () => {
                onOpenWorkspaceScreen();
                splitWorkspaceTab(
                    activeTab.id,
                    splitView?.activePaneId ?? null,
                    "bottom",
                );
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
            label: "Focus current split",
            description: "Move focus to the active split pane.",
            icon: CommandIcon,
            keywords: "split left top pane focus editor",
            meta: hotkeyLabels.focusWorkspaceLeftPane,
            onSelect: () => {
                onOpenWorkspaceScreen();
                if (splitView.activePaneId) {
                    focusWorkspacePane(splitView.activePaneId);
                }
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

function getExecuteActiveTabDescription(
    fileName: string,
    executorState: CommandPaletteTabOptions["workspaceExecutor"]["state"],
): string {
    if (!executorState.hasSupportedExecutor) {
        return "No supported executor detected.";
    }

    if (!executorState.isAttached) {
        return "Attach to an executor before executing.";
    }

    if (executorState.isBusy) {
        return "Executor is busy.";
    }

    return `Run ${fileName} through the executor.`;
}

async function beautifyActiveTab({
    activeTabId,
    content,
    fileName,
    onClearErrorMessage,
    onSetErrorMessage,
    onUpdateWorkspaceTabContent,
}: {
    activeTabId: string;
    content: string;
    fileName: string;
    onClearErrorMessage: () => void;
    onSetErrorMessage: (message: string | null) => void;
    onUpdateWorkspaceTabContent: (tabId: string, content: string) => void;
}): Promise<void> {
    try {
        const result = await formatLuauScript({ content });

        setLiveWorkspaceEditorContent(activeTabId, result.formatted);
        onUpdateWorkspaceTabContent(activeTabId, result.formatted);
        onClearErrorMessage();
    } catch (error: unknown) {
        const message = getErrorMessage(
            error,
            `Could not beautify ${fileName}.`,
        );

        console.warn(message);
        onSetErrorMessage(message);
    }
}
