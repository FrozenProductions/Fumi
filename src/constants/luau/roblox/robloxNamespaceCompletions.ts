import type { LuauNamespaceCompletionGroup } from "../../../lib/luau/luau.type";
import { ROBLOX_BRICKCOLOR_NAMESPACE_COMPLETION } from "./namespaces/dataTypes/robloxBrickColorNamespaceCompletion";
import { ROBLOX_CFRAME_NAMESPACE_COMPLETION } from "./namespaces/dataTypes/robloxCFrameNamespaceCompletion";
import { ROBLOX_COLOR3_NAMESPACE_COMPLETION } from "./namespaces/dataTypes/robloxColor3NamespaceCompletion";
import { ROBLOX_DATETIME_NAMESPACE_COMPLETION } from "./namespaces/dataTypes/robloxDateTimeNamespaceCompletion";
import { ROBLOX_TWEENINFO_NAMESPACE_COMPLETION } from "./namespaces/dataTypes/robloxTweenInfoNamespaceCompletion";
import { ROBLOX_UDIM2_NAMESPACE_COMPLETION } from "./namespaces/dataTypes/robloxUDim2NamespaceCompletion";
import { ROBLOX_VECTOR2_NAMESPACE_COMPLETION } from "./namespaces/dataTypes/robloxVector2NamespaceCompletion";
import { ROBLOX_VECTOR3_NAMESPACE_COMPLETION } from "./namespaces/dataTypes/robloxVector3NamespaceCompletion";
import { ROBLOX_ENUM_NAMESPACE_COMPLETION } from "./namespaces/engine/robloxEnumNamespaceCompletion";
import { ROBLOX_INSTANCE_NAMESPACE_COMPLETION } from "./namespaces/engine/robloxInstanceNamespaceCompletion";
import { ROBLOX_RANDOM_NAMESPACE_COMPLETION } from "./namespaces/engine/robloxRandomNamespaceCompletion";
import { ROBLOX_TASK_NAMESPACE_COMPLETION } from "./namespaces/engine/robloxTaskNamespaceCompletion";

export const ROBLOX_NAMESPACE_COMPLETIONS: LuauNamespaceCompletionGroup[] = [
    ROBLOX_TASK_NAMESPACE_COMPLETION,
    ROBLOX_ENUM_NAMESPACE_COMPLETION,
    ROBLOX_INSTANCE_NAMESPACE_COMPLETION,
    ROBLOX_COLOR3_NAMESPACE_COMPLETION,
    ROBLOX_VECTOR2_NAMESPACE_COMPLETION,
    ROBLOX_VECTOR3_NAMESPACE_COMPLETION,
    ROBLOX_UDIM2_NAMESPACE_COMPLETION,
    ROBLOX_CFRAME_NAMESPACE_COMPLETION,
    ROBLOX_DATETIME_NAMESPACE_COMPLETION,
    ROBLOX_BRICKCOLOR_NAMESPACE_COMPLETION,
    ROBLOX_RANDOM_NAMESPACE_COMPLETION,
    ROBLOX_TWEENINFO_NAMESPACE_COMPLETION,
];
