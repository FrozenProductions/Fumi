import {
    DEFAULT_WORKSPACE_SPLIT_RATIO,
    MAX_WORKSPACE_SPLIT_RATIO,
    MIN_WORKSPACE_SPLIT_RATIO,
} from "../../constants/workspace/workspace";
import { clamp } from "../shared/math";

/**
 * Clamps a split ratio value to the valid range [MIN_WORKSPACE_SPLIT_RATIO, MAX_WORKSPACE_SPLIT_RATIO].
 *
 * @remarks
 * Returns DEFAULT_WORKSPACE_SPLIT_RATIO for non-finite values.
 */
export function normalizeWorkspaceSplitRatio(splitRatio: number): number {
    if (!Number.isFinite(splitRatio)) {
        return DEFAULT_WORKSPACE_SPLIT_RATIO;
    }

    return clamp(
        splitRatio,
        MIN_WORKSPACE_SPLIT_RATIO,
        MAX_WORKSPACE_SPLIT_RATIO,
    );
}
