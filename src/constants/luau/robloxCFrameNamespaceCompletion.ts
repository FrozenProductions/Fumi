import {
    createLuauLanguageCompletionItem as createItem,
    createLuauNamespaceCompletionGroup as createNamespaceGroup,
} from "../../lib/luau/completionBuilder";
import type { LuauNamespaceCompletionGroup } from "../../lib/luau/luau.type";
import { ROBLOX_DOC_SOURCE } from "./robloxCompletionSources";

export const ROBLOX_CFRAME_NAMESPACE_COMPLETION: LuauNamespaceCompletionGroup =
    createNamespaceGroup("CFrame", [
        createItem(
            "Angles",
            "function",
            "constructor",
            "Create a rotation CFrame from Euler angles in radians.",
            ROBLOX_DOC_SOURCE,
            {
                namespace: "CFrame",
                signature:
                    "CFrame.Angles(rx: number, ry: number, rz: number) -> CFrame",
            },
        ),
        createItem(
            "fromAxisAngle",
            "function",
            "constructor",
            "Create a rotation CFrame from an axis-angle pair.",
            ROBLOX_DOC_SOURCE,
            {
                namespace: "CFrame",
                signature:
                    "CFrame.fromAxisAngle(axis: Vector3, angle: number) -> CFrame",
            },
        ),
        createItem(
            "fromEulerAnglesXYZ",
            "function",
            "constructor",
            "Create a rotation CFrame from XYZ Euler angles.",
            ROBLOX_DOC_SOURCE,
            {
                namespace: "CFrame",
                signature:
                    "CFrame.fromEulerAnglesXYZ(rx: number, ry: number, rz: number) -> CFrame",
            },
        ),
        createItem(
            "fromMatrix",
            "function",
            "constructor",
            "Create a CFrame from basis vectors.",
            ROBLOX_DOC_SOURCE,
            {
                namespace: "CFrame",
                signature:
                    "CFrame.fromMatrix(pos: Vector3, vx: Vector3, vy: Vector3, vz?: Vector3) -> CFrame",
            },
        ),
        createItem(
            "lookAt",
            "function",
            "constructor",
            "Create a CFrame oriented toward a target point.",
            ROBLOX_DOC_SOURCE,
            {
                namespace: "CFrame",
                signature:
                    "CFrame.lookAt(at: Vector3, lookAt: Vector3, up?: Vector3) -> CFrame",
            },
        ),
        createItem(
            "new",
            "function",
            "constructor",
            "Create a CFrame from translation or coordinate-frame components.",
            ROBLOX_DOC_SOURCE,
            { namespace: "CFrame", signature: "CFrame.new(...any) -> CFrame" },
        ),
    ]);
