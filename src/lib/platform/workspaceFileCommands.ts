import type {
    DroppedWorkspaceScriptDraft,
    WorkspaceCursorState,
    WorkspaceTabSnapshot,
    WorkspaceTabState,
} from "../workspace/workspace.type";
import { isTauriEnvironment } from "./runtime";
import {
    createDesktopShellRequiredError,
    invokeWorkspaceCommand,
    invokeWorkspaceVoidCommand,
} from "./workspaceCommandShared";

/**
 * Creates a new workspace file with optional initial content.
 *
 * Invokes the `create_workspace_file` Tauri command.
 *
 * @param options - File creation options
 * @param options.workspacePath - Absolute path to the workspace directory
 * @param options.fileName - Optional file name for the new tab
 * @param options.initialContent - Optional initial content for the file
 * @returns The created tab snapshot
 * @throws {WorkspaceCommandError} If the command fails or the desktop shell is unavailable
 */
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

/**
 * Imports a dropped file as a workspace script draft.
 *
 * Invokes the `import_workspace_file` Tauri command.
 *
 * @param options - Import options
 * @param options.filePath - Absolute path to the file to import
 * @returns The imported script draft
 * @throws {WorkspaceCommandError} If the command fails or the desktop shell is unavailable
 */
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

/**
 * Saves workspace tab content and cursor state to disk.
 *
 * Invokes the `save_workspace_file` Tauri command.
 *
 * @param options - Save options
 * @param options.workspacePath - Absolute path to the workspace directory
 * @param options.tabId - ID of the tab to save
 * @param options.content - File content to persist
 * @param options.cursor - Current cursor state
 * @throws {WorkspaceCommandError} If the command fails or the desktop shell is unavailable
 */
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

/**
 * Renames a workspace tab file with case-only rename support on macOS.
 *
 * Invokes the `rename_workspace_file` Tauri command.
 *
 * @param options - Rename options
 * @param options.workspacePath - Absolute path to the workspace directory
 * @param options.tabId - ID of the tab to rename
 * @param options.fileName - New file name
 * @returns The updated tab state
 * @throws {WorkspaceCommandError} If the command fails or the desktop shell is unavailable
 */
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

/**
 * Deletes a workspace tab and its file from disk.
 *
 * Invokes the `delete_workspace_file` Tauri command.
 *
 * @param options - Delete options
 * @param options.workspacePath - Absolute path to the workspace directory
 * @param options.tabId - ID of the tab to delete
 * @throws {WorkspaceCommandError} If the command fails or the desktop shell is unavailable
 */
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
