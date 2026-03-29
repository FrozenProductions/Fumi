import { Add01Icon, FolderOpenIcon } from "@hugeicons/core-free-icons";
import type { ReactElement } from "react";
import { APP_HOTKEYS } from "../../constants/app/hotkeys";
import { useAppStore } from "../../hooks/app/useAppStore";
import { useWorkspaceCodeCompletion } from "../../hooks/workspace/useWorkspaceCodeCompletion";
import { useWorkspaceTabRename } from "../../hooks/workspace/useWorkspaceTabRename";
import { getEditorModeForFileName } from "../../lib/luau/fileType";
import type { UseWorkspaceSessionResult } from "../../types/workspace/session";
import { WorkspaceEditor } from "./WorkspaceEditor";
import { WorkspaceErrorBanner } from "./WorkspaceErrorBanner";
import { WorkspaceMessageState } from "./WorkspaceMessageState";
import { WorkspaceTabBar } from "./WorkspaceTabBar";

type WorkspaceScreenProps = {
    session: UseWorkspaceSessionResult;
};

export function WorkspaceScreen({
    session,
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
        handleCompletionHover,
        handleCursorChange,
        handleEditorChange,
        handleEditorLoad,
        handleScroll,
    } = useWorkspaceCodeCompletion({
        activeEditorMode,
        activeTab,
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
            {workspace.tabs.length > 0 ? (
                <WorkspaceTabBar
                    workspace={workspace}
                    renameState={renameState}
                    onCreateFile={handleCreateWorkspaceFile}
                    onSelectTab={selectWorkspaceTab}
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
                    <WorkspaceEditor
                        activeEditorMode={activeEditorMode}
                        activeTab={activeTab}
                        appTheme={appTheme}
                        editorFontSize={editorSettings.fontSize}
                        acceptCompletion={acceptCompletion}
                        completionPopup={completionPopup}
                        handleCompletionHover={handleCompletionHover}
                        handleCursorChange={handleCursorChange}
                        handleEditorChange={handleEditorChange}
                        handleEditorLoad={handleEditorLoad}
                        handleScroll={handleScroll}
                    />
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
