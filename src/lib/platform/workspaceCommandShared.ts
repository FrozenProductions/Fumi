import { invoke } from "@tauri-apps/api/core";
import { getUnknownCauseMessage } from "../shared/errorMessage";
import { WorkspaceCommandError } from "./errors";

export const DESKTOP_SHELL_REQUIRED_ERROR =
    "Workspace commands require the Tauri desktop shell.";

export function createDesktopShellRequiredError(
    operation: string,
): WorkspaceCommandError {
    return new WorkspaceCommandError({
        operation,
        message: DESKTOP_SHELL_REQUIRED_ERROR,
    });
}

export function createWorkspaceCommandError(
    operation: string,
    error: unknown,
    fallbackMessage: string,
): WorkspaceCommandError {
    return new WorkspaceCommandError({
        operation,
        message: getUnknownCauseMessage(error, fallbackMessage),
    });
}

export async function invokeWorkspaceCommand<T>(
    command: string,
    operation: string,
    args?: Record<string, unknown>,
): Promise<T> {
    try {
        return await invoke<T>(command, args);
    } catch (error) {
        throw createWorkspaceCommandError(
            operation,
            error,
            `Could not complete ${operation}.`,
        );
    }
}

export async function invokeWorkspaceVoidCommand(
    command: string,
    operation: string,
    args?: Record<string, unknown>,
): Promise<void> {
    try {
        await invoke<void>(command, args);
    } catch (error) {
        throw createWorkspaceCommandError(
            operation,
            error,
            `Could not complete ${operation}.`,
        );
    }
}
