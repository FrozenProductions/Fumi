import type { LuauNamespaceCompletionGroup } from "../../../lib/luau/luau.type";
import { ROBLOX_BRICKCOLOR_NAMESPACE_COMPLETION } from "./robloxBrickColorNamespaceCompletion";
import { ROBLOX_CFRAME_NAMESPACE_COMPLETION } from "./robloxCFrameNamespaceCompletion";
import { ROBLOX_COLOR3_NAMESPACE_COMPLETION } from "./robloxColor3NamespaceCompletion";
import { ROBLOX_DATETIME_NAMESPACE_COMPLETION } from "./robloxDateTimeNamespaceCompletion";
import { ROBLOX_ENUM_NAMESPACE_COMPLETION } from "./robloxEnumNamespaceCompletion";
import { ROBLOX_INSTANCE_NAMESPACE_COMPLETION } from "./robloxInstanceNamespaceCompletion";
import { ROBLOX_RANDOM_NAMESPACE_COMPLETION } from "./robloxRandomNamespaceCompletion";
import { ROBLOX_TASK_NAMESPACE_COMPLETION } from "./robloxTaskNamespaceCompletion";
import { ROBLOX_TWEENINFO_NAMESPACE_COMPLETION } from "./robloxTweenInfoNamespaceCompletion";
import { ROBLOX_UDIM2_NAMESPACE_COMPLETION } from "./robloxUDim2NamespaceCompletion";
import { ROBLOX_VECTOR2_NAMESPACE_COMPLETION } from "./robloxVector2NamespaceCompletion";
import { ROBLOX_VECTOR3_NAMESPACE_COMPLETION } from "./robloxVector3NamespaceCompletion";

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
