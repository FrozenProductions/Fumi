import { invoke } from "@tauri-apps/api/core";
import { DESKTOP_SHELL_REQUIRED_ERROR } from "../../constants/platform/platform";
import { getUnknownCauseMessage } from "../shared/errorMessage";
import { WorkspaceCommandError } from "./errors";

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
