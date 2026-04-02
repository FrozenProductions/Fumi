import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { Effect } from "effect";
import { runPromise } from "../shared/effectRuntime";
import { getUnknownCauseMessage } from "../shared/errorMessage";
import { PlatformOperationError } from "./errors";

export async function copyTextToClipboard(text: string): Promise<void> {
    return runPromise(copyTextToClipboardEffect(text));
}

export function copyTextToClipboardEffect(
    text: string,
): Effect.Effect<void, PlatformOperationError> {
    return Effect.tryPromise({
        try: () => writeText(text),
        catch: (error) =>
            new PlatformOperationError({
                operation: "copyTextToClipboard",
                message: getUnknownCauseMessage(
                    error,
                    "Could not copy text to the clipboard.",
                ),
            }),
    });
}
