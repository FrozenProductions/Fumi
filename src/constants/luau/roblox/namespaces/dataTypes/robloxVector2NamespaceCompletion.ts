import {
    createLuauLanguageCompletionItem as createItem,
    createLuauNamespaceCompletionGroup as createNamespaceGroup,
} from "../../../../../lib/luau/completion/completionBuilder";
import type { LuauNamespaceCompletionGroup } from "../../../../../lib/luau/luau.type";
import { ROBLOX_DOC_SOURCE } from "../../robloxCompletionSources";

export const ROBLOX_VECTOR2_NAMESPACE_COMPLETION: LuauNamespaceCompletionGroup =
    createNamespaceGroup("Vector2", [
        createItem(
            "new",
            "function",
            "constructor",
            "Create a 2D vector.",
            ROBLOX_DOC_SOURCE,
            {
                namespace: "Vector2",
                signature: "Vector2.new(x: number, y: number) -> Vector2",
            },
        ),
        createItem(
            "one",
            "constant",
            "constant",
            "Unit vector with both components set to 1.",
            ROBLOX_DOC_SOURCE,
            { namespace: "Vector2" },
        ),
        createItem(
            "zero",
            "constant",
            "constant",
            "Zero vector.",
            ROBLOX_DOC_SOURCE,
            { namespace: "Vector2" },
        ),
    ]);
