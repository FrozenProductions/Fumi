import {
    DEFAULT_WORKSPACE_SPLIT_RATIO,
    MAX_WORKSPACE_SPLIT_RATIO,
    MIN_WORKSPACE_SPLIT_RATIO,
    WORKSPACE_SPLIT_CLOSE_THRESHOLD,
} from "../../constants/workspace/workspace";
import { clamp } from "../shared/math";

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

export function shouldCloseWorkspaceSplitView(splitRatio: number): boolean {
    return (
        !Number.isFinite(splitRatio) ||
        splitRatio <= WORKSPACE_SPLIT_CLOSE_THRESHOLD ||
        splitRatio >= 1 - WORKSPACE_SPLIT_CLOSE_THRESHOLD
    );
}
