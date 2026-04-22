import type {
    DroppedWorkspaceScriptDraft,
    WorkspaceCursorState,
    WorkspaceTabSnapshot,
    WorkspaceTabState,
} from "../../lib/workspace/workspace.type";
import { isTauriEnvironment } from "./runtime";
import {
    createDesktopShellRequiredError,
    invokeWorkspaceCommand,
    invokeWorkspaceVoidCommand,
} from "./workspaceCommandShared";

export function createWorkspaceFile(options: {
    workspacePath: string;
    fileName?: string;
    initialContent?: string;
}): Promise<WorkspaceTabSnapshot> {
    if (!isTauriEnvironment()) {
        return Promise.reject(
            createDesktopShellRequiredError("createWorkspaceFile"),
        );
    }

    return invokeWorkspaceCommand<WorkspaceTabSnapshot>(
        "create_workspace_file",
        "createWorkspaceFile",
        options,
    );
}

export function importWorkspaceFile(options: {
    filePath: string;
}): Promise<DroppedWorkspaceScriptDraft> {
    if (!isTauriEnvironment()) {
        return Promise.reject(
            createDesktopShellRequiredError("importWorkspaceFile"),
        );
    }

    return invokeWorkspaceCommand<DroppedWorkspaceScriptDraft>(
        "import_workspace_file",
        "importWorkspaceFile",
        options,
    );
}

export function saveWorkspaceFile(options: {
    workspacePath: string;
    tabId: string;
    content: string;
    cursor: WorkspaceCursorState;
}): Promise<void> {
    if (!isTauriEnvironment()) {
        return Promise.reject(
            createDesktopShellRequiredError("saveWorkspaceFile"),
        );
    }

    return invokeWorkspaceVoidCommand(
        "save_workspace_file",
        "saveWorkspaceFile",
        options,
    );
}

export function renameWorkspaceFile(options: {
    workspacePath: string;
    tabId: string;
    fileName: string;
}): Promise<WorkspaceTabState> {
    if (!isTauriEnvironment()) {
        return Promise.reject(
            createDesktopShellRequiredError("renameWorkspaceFile"),
        );
    }

    return invokeWorkspaceCommand<WorkspaceTabState>(
        "rename_workspace_file",
        "renameWorkspaceFile",
        options,
    );
}

export function deleteWorkspaceFile(options: {
    workspacePath: string;
    tabId: string;
}): Promise<void> {
    if (!isTauriEnvironment()) {
        return Promise.reject(
            createDesktopShellRequiredError("deleteWorkspaceFile"),
        );
    }

    return invokeWorkspaceVoidCommand(
        "delete_workspace_file",
        "deleteWorkspaceFile",
        options,
    );
}
