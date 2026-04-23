import {
    createLuauLanguageCompletionItem as createItem,
    createLuauNamespaceCompletionGroup as createNamespaceGroup,
} from "../../../../../lib/luau/completion/completionBuilder";
import type { LuauNamespaceCompletionGroup } from "../../../../../lib/luau/luau.type";
import { ROBLOX_DOC_SOURCE } from "../../robloxCompletionSources";

export const ROBLOX_BRICKCOLOR_NAMESPACE_COMPLETION: LuauNamespaceCompletionGroup =
    createNamespaceGroup("BrickColor", [
        createItem(
            "new",
            "function",
            "constructor",
            "Create a BrickColor from a name, number, or Color3.",
            ROBLOX_DOC_SOURCE,
            {
                namespace: "BrickColor",
                signature: "BrickColor.new(value?: any) -> BrickColor",
            },
        ),
        createItem(
            "palette",
            "function",
            "constructor",
            "Return the built-in BrickColor palette.",
            ROBLOX_DOC_SOURCE,
            {
                namespace: "BrickColor",
                signature: "BrickColor.palette(index: number) -> BrickColor",
            },
        ),
        createItem(
            "random",
            "function",
            "constructor",
            "Return a random BrickColor from the palette.",
            ROBLOX_DOC_SOURCE,
            {
                namespace: "BrickColor",
                signature: "BrickColor.random() -> BrickColor",
            },
        ),
    ]);
