import type { SuncGlobalDataEntry } from "./suncCompletions.type";
import { SUNC_GLOBAL_DATA_PART_1 } from "./suncGlobalDataPart1";
import { SUNC_GLOBAL_DATA_PART_2 } from "./suncGlobalDataPart2";

export const SUNC_GLOBAL_DATA = [
    ...SUNC_GLOBAL_DATA_PART_1,
    ...SUNC_GLOBAL_DATA_PART_2,
] as const satisfies readonly SuncGlobalDataEntry[];
