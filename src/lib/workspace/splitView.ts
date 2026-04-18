import {
    DEFAULT_WORKSPACE_SPLIT_RATIO,
    MAX_WORKSPACE_SPLIT_RATIO,
    MIN_WORKSPACE_SPLIT_RATIO,
    WORKSPACE_SPLIT_CLOSE_THRESHOLD,
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

/**
 * Determines if a split view should be closed based on the split ratio.
 *
 * @remarks
 * Returns true if the ratio is invalid or within the close threshold of either end (0 or 1).
 */
export function shouldCloseWorkspaceSplitView(splitRatio: number): boolean {
    return (
        !Number.isFinite(splitRatio) ||
        splitRatio <= WORKSPACE_SPLIT_CLOSE_THRESHOLD ||
        splitRatio >= 1 - WORKSPACE_SPLIT_CLOSE_THRESHOLD
    );
}
