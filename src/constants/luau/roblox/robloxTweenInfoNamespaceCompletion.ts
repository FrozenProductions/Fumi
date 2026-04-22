import {
    createLuauLanguageCompletionItem as createItem,
    createLuauNamespaceCompletionGroup as createNamespaceGroup,
} from "../../../lib/luau/completionBuilder";
import type { LuauNamespaceCompletionGroup } from "../../../lib/luau/luau.type";
import { ROBLOX_DOC_SOURCE } from "./robloxCompletionSources";

export const ROBLOX_TWEENINFO_NAMESPACE_COMPLETION: LuauNamespaceCompletionGroup =
    createNamespaceGroup("TweenInfo", [
        createItem(
            "new",
            "function",
            "constructor",
            "Create tween playback configuration data.",
            ROBLOX_DOC_SOURCE,
            {
                namespace: "TweenInfo",
                signature:
                    "TweenInfo.new(time: number, easingStyle?: Enum.EasingStyle, easingDirection?: Enum.EasingDirection, repeatCount?: number, reverses?: boolean, delayTime?: number) -> TweenInfo",
            },
        ),
    ]);
