import { invoke } from "@tauri-apps/api/core";
import { DESKTOP_SHELL_REQUIRED_ERROR } from "../../constants/platform/platform";
import { getUnknownCauseMessage } from "../shared/errorMessage";
import { WorkspaceCommandError } from "./errors";

/**
 * Creates a {@link WorkspaceCommandError} indicating the Tauri desktop shell is required.
 *
 * @param operation - Name of the operation that requires the desktop shell
 * @returns A rejection-ready error with the desktop shell required message
 */
export function createDesktopShellRequiredError(
    operation: string,
): WorkspaceCommandError {
    return new WorkspaceCommandError({
        operation,
        message: DESKTOP_SHELL_REQUIRED_ERROR,
    });
}

/**
 * Creates a {@link WorkspaceCommandError} from an unknown error, using a fallback message
 * when the cause cannot be determined.
 *
 * @param operation - Name of the failing operation
 * @param error - The original error thrown by the Tauri invoke call
 * @param fallbackMessage - Message to use when the error cause is unknown
 * @returns A typed workspace command error
 */
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

/**
 * Invokes a Tauri workspace command that returns a typed value.
 *
 * Wraps `invoke()` with standardized error handling that converts unknown
 * errors into {@link WorkspaceCommandError}.
 *
 * @param command - The Tauri command name (e.g. `"open_workspace"`)
 * @param operation - Human-readable operation name for error messages
 * @param args - Optional arguments to pass to the command
 * @returns The command response parsed as type `T`
 * @throws {WorkspaceCommandError} If the invoke call fails
 */
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

/**
 * Invokes a Tauri workspace command that returns no value.
 *
 * Wraps `invoke()` with standardized error handling that converts unknown
 * errors into {@link WorkspaceCommandError}.
 *
 * @param command - The Tauri command name (e.g. `"persist_workspace_state"`)
 * @param operation - Human-readable operation name for error messages
 * @param args - Optional arguments to pass to the command
 * @throws {WorkspaceCommandError} If the invoke call fails
 */
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
