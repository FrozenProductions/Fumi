import {
    createLuauLanguageCompletionItem as createItem,
    createLuauNamespaceCompletionGroup as createNamespaceGroup,
} from "../../../lib/luau/completionBuilder";
import type { LuauNamespaceCompletionGroup } from "../../../lib/luau/luau.type";
import { ROBLOX_DOC_SOURCE } from "./robloxCompletionSources";

export const ROBLOX_TASK_NAMESPACE_COMPLETION: LuauNamespaceCompletionGroup =
    createNamespaceGroup("task", [
        createItem(
            "cancel",
            "function",
            "task function",
            "Cancel a scheduled task thread.",
            ROBLOX_DOC_SOURCE,
            {
                namespace: "task",
                signature: "task.cancel(thread: thread) -> ()",
            },
        ),
        createItem(
            "defer",
            "function",
            "task function",
            "Schedule work for the next resumption cycle.",
            ROBLOX_DOC_SOURCE,
            {
                namespace: "task",
                signature:
                    "task.defer(fn: (...any) -> ...any, ...any) -> thread",
            },
        ),
        createItem(
            "delay",
            "function",
            "task function",
            "Schedule a callback after a delay in seconds.",
            ROBLOX_DOC_SOURCE,
            {
                namespace: "task",
                signature:
                    "task.delay(duration: number, fn: (...any) -> ...any, ...any) -> thread",
            },
        ),
        createItem(
            "desynchronize",
            "function",
            "task function",
            "Move execution off the synchronized scheduler lane where supported.",
            ROBLOX_DOC_SOURCE,
            { namespace: "task", signature: "task.desynchronize() -> ()" },
        ),
        createItem(
            "spawn",
            "function",
            "task function",
            "Schedule work asynchronously.",
            ROBLOX_DOC_SOURCE,
            {
                namespace: "task",
                signature:
                    "task.spawn(fn: (...any) -> ...any, ...any) -> thread",
            },
        ),
        createItem(
            "synchronize",
            "function",
            "task function",
            "Return execution to the synchronized scheduler lane where supported.",
            ROBLOX_DOC_SOURCE,
            { namespace: "task", signature: "task.synchronize() -> ()" },
        ),
        createItem(
            "wait",
            "function",
            "task function",
            "Yield until the next heartbeat or until a duration passes.",
            ROBLOX_DOC_SOURCE,
            {
                namespace: "task",
                signature: "task.wait(duration?: number) -> number",
            },
        ),
    ]);
