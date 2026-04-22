import { FolderOpenIcon } from "@hugeicons/core-free-icons";
import type { ReactElement } from "react";
import { useCallback } from "react";
import workspaceIcon from "../../assets/icons/workspace.svg";
import { useWorkspaceStore } from "../../hooks/workspace/useWorkspaceStore";
import { createMaskStyle } from "../../lib/shared/mask";
import { AppIcon } from "../app/AppIcon";
import { WorkspaceErrorBanner } from "./WorkspaceErrorBanner";
import { WorkspaceMessageState } from "./WorkspaceMessageState";
import { WorkspaceReadyScreen } from "./WorkspaceReadyScreen";
import type { WorkspaceScreenProps } from "./workspaceScreen.type";

const WORKSPACE_ICON_STYLE = createMaskStyle(workspaceIcon);

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
            <section className="flex h-full min-h-0 flex-col bg-fumi-50">
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
            <section className="flex h-full min-h-0 flex-col bg-fumi-50">
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
                <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-fumi-50/30 p-4">
                    <div className="flex flex-1 items-center justify-center bg-fumi-50 p-8">
                        <div className="mx-auto flex max-w-lg flex-col items-center text-center">
                            <div
                                aria-hidden="true"
                                className="mx-auto h-24 w-24 bg-fumi-600"
                                style={WORKSPACE_ICON_STYLE}
                            />
                            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.32em] text-fumi-500">
                                Workspace
                            </p>
                            <p className="mt-4 text-base leading-7 text-fumi-400">
                                Pick a folder where you want to keep your
                                scripts. You can change it later from the
                                workspace button in the top bar.
                            </p>
                            <button
                                type="button"
                                onClick={chooseWorkspaceAction.onClick}
                                className="app-select-none mt-6 inline-flex h-10 items-center gap-2 rounded-[0.8rem] border border-fumi-200 bg-fumi-600 px-4 text-sm font-semibold tracking-[0.01em] text-white transition-[background-color,border-color,transform] duration-150 ease-out hover:-translate-y-0.5 hover:border-fumi-700 hover:bg-fumi-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-2 focus-visible:ring-offset-fumi-50"
                            >
                                <AppIcon
                                    icon={chooseWorkspaceAction.icon}
                                    size={16}
                                    strokeWidth={2.4}
                                />
                                {chooseWorkspaceAction.label}
                            </button>
                        </div>
                    </div>
                </div>
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
