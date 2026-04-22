import {
    createLuauLanguageCompletionItem as createItem,
    createLuauNamespaceCompletionGroup as createNamespaceGroup,
} from "../../lib/luau/completionBuilder";
import type { LuauNamespaceCompletionGroup } from "../../lib/luau/luau.type";
import { ROBLOX_DOC_SOURCE } from "./robloxCompletionSources";

export const ROBLOX_VECTOR3_NAMESPACE_COMPLETION: LuauNamespaceCompletionGroup =
    createNamespaceGroup("Vector3", [
        createItem(
            "new",
            "function",
            "constructor",
            "Create a 3D vector.",
            ROBLOX_DOC_SOURCE,
            {
                namespace: "Vector3",
                signature:
                    "Vector3.new(x: number, y: number, z: number) -> Vector3",
            },
        ),
        createItem(
            "one",
            "constant",
            "constant",
            "Unit vector with all components set to 1.",
            ROBLOX_DOC_SOURCE,
            { namespace: "Vector3" },
        ),
        createItem(
            "xAxis",
            "constant",
            "constant",
            "Unit vector on the X axis.",
            ROBLOX_DOC_SOURCE,
            { namespace: "Vector3" },
        ),
        createItem(
            "yAxis",
            "constant",
            "constant",
            "Unit vector on the Y axis.",
            ROBLOX_DOC_SOURCE,
            { namespace: "Vector3" },
        ),
        createItem(
            "zAxis",
            "constant",
            "constant",
            "Unit vector on the Z axis.",
            ROBLOX_DOC_SOURCE,
            { namespace: "Vector3" },
        ),
        createItem(
            "zero",
            "constant",
            "constant",
            "Zero vector.",
            ROBLOX_DOC_SOURCE,
            { namespace: "Vector3" },
        ),
    ]);
