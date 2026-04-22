import { FolderOpenIcon } from "@hugeicons/core-free-icons";
import type { ReactElement } from "react";
import { useCallback } from "react";
import { useWorkspaceStore } from "../../hooks/workspace/useWorkspaceStore";
import { WorkspaceErrorBanner } from "./WorkspaceErrorBanner";
import { WorkspaceMessageState } from "./WorkspaceMessageState";
import { WorkspaceReadyScreen } from "./WorkspaceReadyScreen";
import type { WorkspaceScreenProps } from "./workspaceScreen.type";

/**
 * The main workspace screen containing tabs, editor, and split view.
 *
 * @param props - Component props
 * @param props.session - Workspace session state and actions
 * @param props.executor - Executor state and actions
 * @returns A React component
 */
export function WorkspaceScreen({
    executor,
    executionHistoryModal,
}: WorkspaceScreenProps): ReactElement {
    const workspace = useWorkspaceStore((state) => state.workspace);
    const isBootstrapping = useWorkspaceStore((state) => state.isBootstrapping);
    const errorMessage = useWorkspaceStore((state) => state.errorMessage);
    const openWorkspaceDirectory = useWorkspaceStore(
        (state) => state.openWorkspaceDirectory,
    );
    const clearErrorMessage = useWorkspaceStore(
        (state) => state.clearErrorMessage,
    );
    const executorState = executor.state;
    const clearExecutorErrorMessage = executor.actions.clearErrorMessage;

    const handleOpenWorkspaceDirectory = useCallback((): void => {
        void openWorkspaceDirectory();
    }, [openWorkspaceDirectory]);

    const chooseWorkspaceAction = {
        label: "Choose workspace",
        onClick: handleOpenWorkspaceDirectory,
        icon: FolderOpenIcon,
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
                    <WorkspaceErrorBanner
                        errorMessage={errorMessage}
                        onClose={clearErrorMessage}
                    />
                ) : null}
                {executorState.errorMessage ? (
                    <WorkspaceErrorBanner
                        errorMessage={executorState.errorMessage}
                        onClose={clearExecutorErrorMessage}
                    />
                ) : null}
                <WorkspaceMessageState
                    eyebrow="Workspace"
                    title="Choose a folder to store scripts"
                    description="Pick a folder where you want to keep your scripts. You can change it later from the workspace button in the top bar."
                    action={chooseWorkspaceAction}
                />
            </section>
        );
    }

    return (
        <WorkspaceReadyScreen
            executor={executor}
            executionHistoryModal={executionHistoryModal}
        />
    );
}
