import type { TopLevelDataEntry } from "../uncCompletions.type";
import { UNC_TOP_LEVEL_DATA_PART_1 } from "./uncTopLevelDataPart1";
import { UNC_TOP_LEVEL_DATA_PART_2 } from "./uncTopLevelDataPart2";
import { UNC_TOP_LEVEL_DATA_PART_3 } from "./uncTopLevelDataPart3";

export const UNC_TOP_LEVEL_DATA = [
    ...UNC_TOP_LEVEL_DATA_PART_1,
    ...UNC_TOP_LEVEL_DATA_PART_2,
    ...UNC_TOP_LEVEL_DATA_PART_3,
] as const satisfies readonly TopLevelDataEntry[];
