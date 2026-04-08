import { openUrl } from "@tauri-apps/plugin-opener";
import { Effect } from "effect";
import { runPromise } from "../shared/effectRuntime";
import { getUnknownCauseMessage } from "../shared/errorMessage";
import { PlatformOperationError } from "./errors";
import { isTauriEnvironment } from "./runtime";

const OPENER_REQUIRED_ERROR = "Opening links requires the Tauri desktop shell.";

export async function openExternalUrl(url: string): Promise<void> {
    return runPromise(openExternalUrlEffect(url));
}

function openExternalUrlEffect(
    url: string,
): Effect.Effect<void, PlatformOperationError> {
    if (!isTauriEnvironment()) {
        return Effect.sync(() => {
            globalThis.open?.(url, "_blank", "noopener,noreferrer");
        });
    }

    return Effect.tryPromise({
        try: () => openUrl(url),
        catch: (error) =>
            new PlatformOperationError({
                operation: "openExternalUrl",
                message: getUnknownCauseMessage(error, OPENER_REQUIRED_ERROR),
            }),
    });
}
