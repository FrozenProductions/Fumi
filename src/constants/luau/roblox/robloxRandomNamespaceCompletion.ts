import {
    createLuauLanguageCompletionItem as createItem,
    createLuauNamespaceCompletionGroup as createNamespaceGroup,
} from "../../../lib/luau/completionBuilder";
import type { LuauNamespaceCompletionGroup } from "../../../lib/luau/luau.type";
import { ROBLOX_DOC_SOURCE } from "./robloxCompletionSources";

export const ROBLOX_RANDOM_NAMESPACE_COMPLETION: LuauNamespaceCompletionGroup =
    createNamespaceGroup("Random", [
        createItem(
            "new",
            "function",
            "constructor",
            "Create a pseudo-random generator with an optional seed.",
            ROBLOX_DOC_SOURCE,
            {
                namespace: "Random",
                signature: "Random.new(seed?: number) -> Random",
            },
        ),
    ]);
