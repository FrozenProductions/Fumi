import {
    Add01Icon,
    FolderOpenIcon,
    PlayIcon,
} from "@hugeicons/core-free-icons";
import type { ReactElement } from "react";
import { APP_HOTKEYS } from "../../constants/app/hotkeys";
import { useAppStore } from "../../hooks/app/useAppStore";
import { useWorkspaceCodeCompletion } from "../../hooks/workspace/useWorkspaceCodeCompletion";
import type { UseWorkspaceExecutorResult } from "../../hooks/workspace/useWorkspaceExecutor";
import { useWorkspaceTabRename } from "../../hooks/workspace/useWorkspaceTabRename";
import { getEditorModeForFileName } from "../../lib/luau/fileType";
import type { UseWorkspaceSessionResult } from "../../types/workspace/session";
import { AppIcon } from "../app/AppIcon";
import { AppTooltip } from "../app/AppTooltip";
import { WorkspaceEditor } from "./WorkspaceEditor";
import { WorkspaceErrorBanner } from "./WorkspaceErrorBanner";
import { WorkspaceMessageState } from "./WorkspaceMessageState";
import { WorkspaceTabBar } from "./WorkspaceTabBar";

type WorkspaceScreenProps = {
    session: UseWorkspaceSessionResult;
    executor: UseWorkspaceExecutorResult;
};

export function WorkspaceScreen({
    session,
    executor,
}: WorkspaceScreenProps): ReactElement {
    const appTheme = useAppStore((state) => state.theme);
    const editorSettings = useAppStore((state) => state.editorSettings);
    const {
        isBootstrapping,
        workspace,
        activeTab,
        activeTabIndex,
        errorMessage,
        openWorkspaceDirectory,
        createWorkspaceFile,
        archiveWorkspaceTab,
        renameWorkspaceTab,
        selectWorkspaceTab,
        reorderWorkspaceTab,
        saveActiveWorkspaceTab,
        updateActiveTabContent,
        updateActiveTabCursor,
        updateActiveTabScrollTop,
    } = session;
    const activeEditorMode = activeTab
        ? getEditorModeForFileName(activeTab.fileName)
        : "text";
    const renameState = useWorkspaceTabRename({
        workspace,
        renameWorkspaceTab,
        selectWorkspaceTab,
    });
    const {
        acceptCompletion,
        completionPopup,
        createHandleCursorChange,
        createHandleEditorChange,
        createHandleEditorLoad,
        createHandleScroll,
        handleCompletionHover,
    } = useWorkspaceCodeCompletion({
        activeEditorMode,
        activeTabId: activeTab?.id ?? null,
        tabs: workspace?.tabs ?? [],
        isIntellisenseEnabled: editorSettings.isIntellisenseEnabled,
        intellisensePriority: editorSettings.intellisensePriority,
        saveActiveWorkspaceTab,
        updateActiveTabContent,
        updateActiveTabCursor,
        updateActiveTabScrollTop,
    });

    const handleOpenWorkspaceDirectory = (): void => {
        void openWorkspaceDirectory();
    };

    const handleCreateWorkspaceFile = (): void => {
        void createWorkspaceFile();
    };

    const handleArchiveWorkspaceTab = (tabId: string): void => {
        void archiveWorkspaceTab(tabId);
    };
    const executeButtonClassName =
        appTheme === "dark"
            ? "pointer-events-auto inline-flex h-9 items-center justify-center gap-1.5 rounded-[0.5rem] border border-fumi-300 bg-fumi-700 px-3.5 text-xs font-semibold tracking-wide text-fumi-50 shadow-sm transition-[background-color,border-color,transform,box-shadow] duration-150 ease-out hover:-translate-y-0.5 hover:border-fumi-400 hover:bg-fumi-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-2 focus-visible:ring-offset-fumi-50"
            : "pointer-events-auto inline-flex h-9 items-center justify-center gap-1.5 rounded-[0.5rem] border border-fumi-200 bg-fumi-600 px-3.5 text-xs font-semibold tracking-wide text-white shadow-sm transition-[background-color,border-color,transform,box-shadow] duration-150 ease-out hover:-translate-y-0.5 hover:border-fumi-700 hover:bg-fumi-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-2 focus-visible:ring-offset-fumi-50";

    if (isBootstrapping) {
        return (
            <section className="flex h-full min-h-0 flex-col bg-gradient-to-br from-fumi-50 via-fumi-50 to-fumi-100/80">
                <WorkspaceMessageState
                    eyebrow="Loading workspace"
                    title="Restoring your last session"
                    description="Fumi is reconnecting your workspace and editor tabs."
                />
            </section>
        );
    }

    if (!workspace) {
        return (
            <section className="flex h-full min-h-0 flex-col bg-gradient-to-br from-fumi-50 via-fumi-50 to-fumi-100/80">
                {errorMessage ? (
                    <WorkspaceErrorBanner errorMessage={errorMessage} />
                ) : null}
                {executor.errorMessage ? (
                    <WorkspaceErrorBanner
                        errorMessage={executor.errorMessage}
                    />
                ) : null}
                <WorkspaceMessageState
                    eyebrow="Workspace"
                    title="Choose a folder to store scripts"
                    description="Pick a folder where you want to keep your scripts. You can change it later from the workspace button in the top bar."
                    action={{
                        label: "Choose workspace",
                        onClick: handleOpenWorkspaceDirectory,
                        icon: FolderOpenIcon,
                    }}
                />
            </section>
        );
    }

    return (
        <section className="flex h-full min-h-0 flex-col bg-fumi-50">
            {errorMessage ? (
                <WorkspaceErrorBanner errorMessage={errorMessage} />
            ) : null}
            {executor.errorMessage ? (
                <WorkspaceErrorBanner errorMessage={executor.errorMessage} />
            ) : null}
            {workspace.tabs.length > 0 ? (
                <WorkspaceTabBar
                    workspace={workspace}
                    renameState={renameState}
                    onCreateFile={handleCreateWorkspaceFile}
                    onSelectTab={selectWorkspaceTab}
                    onReorderTab={reorderWorkspaceTab}
                    onArchiveTab={handleArchiveWorkspaceTab}
                />
            ) : null}

            <div className="flex min-h-0 flex-1 flex-col">
                {workspace.tabs.length === 0 ? (
                    <WorkspaceMessageState
                        eyebrow={
                            workspace.archivedTabs.length > 0
                                ? "Archived tabs"
                                : "Empty workspace"
                        }
                        title={
                            workspace.archivedTabs.length > 0
                                ? "All tabs are archived"
                                : "Create your first script file"
                        }
                        description={
                            workspace.archivedTabs.length > 0
                                ? "Restore archived tabs from Settings, or create a new file to keep working."
                                : "Scripts are stored directly in this workspace directory. Create a file, then edit it in the editor."
                        }
                        action={{
                            label: "New file",
                            onClick: handleCreateWorkspaceFile,
                            icon: Add01Icon,
                            shortcut: APP_HOTKEYS.CREATE_WORKSPACE_FILE.label,
                        }}
                    />
                ) : activeTab ? (
                    <div className="relative flex min-h-0 flex-1">
                        <WorkspaceEditor
                            activeTabId={activeTab.id}
                            appTheme={appTheme}
                            editorFontSize={editorSettings.fontSize}
                            tabs={workspace.tabs}
                            acceptCompletion={acceptCompletion}
                            completionPopup={completionPopup}
                            createHandleCursorChange={createHandleCursorChange}
                            createHandleEditorChange={createHandleEditorChange}
                            createHandleEditorLoad={createHandleEditorLoad}
                            createHandleScroll={createHandleScroll}
                            handleCompletionHover={handleCompletionHover}
                        />
                        <div className="pointer-events-none absolute bottom-5 right-5 z-20">
                            <AppTooltip
                                content={
                                    executor.isAttached
                                        ? "Execute the current tab in MacSploit"
                                        : "Attach to a MacSploit port before executing"
                                }
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        void executor.executeActiveTab();
                                    }}
                                    disabled={executor.isBusy}
                                    className={`${executeButtonClassName} ${
                                        executor.isBusy
                                            ? "cursor-wait opacity-70"
                                            : ""
                                    }`}
                                >
                                    <AppIcon
                                        icon={PlayIcon}
                                        className={`size-3.5 ${executor.isBusy ? "opacity-50" : ""}`}
                                        strokeWidth={2.5}
                                    />
                                    {executor.isBusy ? "Executing" : "Execute"}
                                </button>
                            </AppTooltip>
                        </div>
                    </div>
                ) : (
                    <WorkspaceMessageState
                        eyebrow="Workspace ready"
                        title="Select a tab to start editing"
                        description={`${workspace.workspaceName} contains ${workspace.tabs.length} registered file${workspace.tabs.length === 1 ? "" : "s"}.`}
                    />
                )}
            </div>
            {workspace.tabs.length === 0 ? (
                <div className="sr-only" aria-live="polite">
                    No active tab
                </div>
            ) : (
                <div className="sr-only" aria-live="polite">
                    {activeTabIndex >= 0 && activeTab
                        ? `${activeTab.fileName} open`
                        : "No active tab"}
                </div>
            )}
        </section>
    );
}
