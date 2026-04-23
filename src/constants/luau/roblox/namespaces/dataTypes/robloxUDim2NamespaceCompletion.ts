import {
    createLuauLanguageCompletionItem as createItem,
    createLuauNamespaceCompletionGroup as createNamespaceGroup,
} from "../../../../../lib/luau/completion/completionBuilder";
import type { LuauNamespaceCompletionGroup } from "../../../../../lib/luau/luau.type";
import { ROBLOX_DOC_SOURCE } from "../../robloxCompletionSources";

export const ROBLOX_UDIM2_NAMESPACE_COMPLETION: LuauNamespaceCompletionGroup =
    createNamespaceGroup("UDim2", [
        createItem(
            "fromOffset",
            "function",
            "constructor",
            "Create a UDim2 using pixel offsets only.",
            ROBLOX_DOC_SOURCE,
            {
                namespace: "UDim2",
                signature: "UDim2.fromOffset(x: number, y: number) -> UDim2",
            },
        ),
        createItem(
            "fromScale",
            "function",
            "constructor",
            "Create a UDim2 using scale components only.",
            ROBLOX_DOC_SOURCE,
            {
                namespace: "UDim2",
                signature: "UDim2.fromScale(x: number, y: number) -> UDim2",
            },
        ),
        createItem(
            "new",
            "function",
            "constructor",
            "Create a UDim2 from scale and offset components.",
            ROBLOX_DOC_SOURCE,
            {
                namespace: "UDim2",
                signature:
                    "UDim2.new(xScale: number, xOffset: number, yScale: number, yOffset: number) -> UDim2",
            },
        ),
    ]);
