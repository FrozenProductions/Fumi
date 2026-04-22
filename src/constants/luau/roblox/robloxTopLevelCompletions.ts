import type { LuauCompletionItem } from "../../../lib/luau/luau.type";
import { ROBLOX_TOP_LEVEL_COMPLETIONS_PART_1 } from "./robloxTopLevelCompletionsPart1";
import { ROBLOX_TOP_LEVEL_COMPLETIONS_PART_2 } from "./robloxTopLevelCompletionsPart2";

export const ROBLOX_TOP_LEVEL_COMPLETIONS: LuauCompletionItem[] = [
    ...ROBLOX_TOP_LEVEL_COMPLETIONS_PART_1,
    ...ROBLOX_TOP_LEVEL_COMPLETIONS_PART_2,
];
