import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { Effect } from "effect";
import { runPromise } from "../shared/effectRuntime";
import { getUnknownCauseMessage } from "../shared/errorMessage";
import { PlatformOperationError } from "./errors";
import { isTauriEnvironment } from "./runtime";

export async function confirmAction(message: string): Promise<boolean> {
    return runPromise(confirmActionEffect(message));
}

export async function pickDirectory(
    defaultPath?: string,
): Promise<string | null> {
    return runPromise(pickDirectoryEffect(defaultPath));
}

export function confirmActionEffect(
    message: string,
): Effect.Effect<boolean, PlatformOperationError> {
    return Effect.tryPromise({
        try: () => {
            if (!isTauriEnvironment()) {
                return Promise.resolve(window.confirm(message));
            }

            return invoke<boolean>("show_confirmation_dialog", { message });
        },
        catch: (error) =>
            new PlatformOperationError({
                operation: "confirmAction",
                message: getUnknownCauseMessage(
                    error,
                    "Could not open the confirmation dialog.",
                ),
            }),
    });
}

export function pickDirectoryEffect(
    defaultPath?: string,
): Effect.Effect<string | null, PlatformOperationError> {
    return Effect.tryPromise({
        try: () =>
            open({
                directory: true,
                multiple: false,
                defaultPath,
            }),
        catch: (error) =>
            new PlatformOperationError({
                operation: "pickDirectory",
                message: getUnknownCauseMessage(
                    error,
                    "Could not open the directory picker.",
                ),
            }),
    }).pipe(
        Effect.map((selection) =>
            typeof selection === "string" ? selection : null,
        ),
    );
}
