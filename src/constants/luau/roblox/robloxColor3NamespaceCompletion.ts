import {
    createLuauLanguageCompletionItem as createItem,
    createLuauNamespaceCompletionGroup as createNamespaceGroup,
} from "../../../lib/luau/completionBuilder";
import type { LuauNamespaceCompletionGroup } from "../../../lib/luau/luau.type";
import { ROBLOX_DOC_SOURCE } from "./robloxCompletionSources";

export const ROBLOX_COLOR3_NAMESPACE_COMPLETION: LuauNamespaceCompletionGroup =
    createNamespaceGroup("Color3", [
        createItem(
            "fromHex",
            "function",
            "constructor",
            "Create a Color3 from a hexadecimal string.",
            ROBLOX_DOC_SOURCE,
            {
                namespace: "Color3",
                signature: "Color3.fromHex(hex: string) -> Color3",
            },
        ),
        createItem(
            "fromHSV",
            "function",
            "constructor",
            "Create a Color3 from HSV components.",
            ROBLOX_DOC_SOURCE,
            {
                namespace: "Color3",
                signature:
                    "Color3.fromHSV(h: number, s: number, v: number) -> Color3",
            },
        ),
        createItem(
            "fromRGB",
            "function",
            "constructor",
            "Create a Color3 from 0-255 RGB components.",
            ROBLOX_DOC_SOURCE,
            {
                namespace: "Color3",
                signature:
                    "Color3.fromRGB(r: number, g: number, b: number) -> Color3",
            },
        ),
        createItem(
            "new",
            "function",
            "constructor",
            "Create a Color3 from 0-1 RGB components.",
            ROBLOX_DOC_SOURCE,
            {
                namespace: "Color3",
                signature:
                    "Color3.new(r: number, g: number, b: number) -> Color3",
            },
        ),
    ]);
