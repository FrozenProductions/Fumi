import type { AppIntellisensePriority } from "../../../lib/app/app.type";
import type { CompletionIndexByPriority } from "../../../lib/luau/completion/completion.type";

export const LUAU_COMPLETION_INDEX_PRIORITIES = [
    "balanced",
    "language",
    "executor",
] as const satisfies readonly AppIntellisensePriority[];

export const EMPTY_LUAU_COMPLETION_INDEX_BY_PRIORITY: CompletionIndexByPriority =
    {
        balanced: [],
        executor: [],
        language: [],
    };
