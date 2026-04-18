import { describe, expect, it } from "vite-plus/test";
import {
    EXECUTION_HISTORY_LARGE_SCRIPT_MAX_CHARACTERS,
    EXECUTION_HISTORY_LARGE_SCRIPT_MAX_LINES,
} from "../../constants/workspace/executionHistory";
import { isLargeExecutionHistoryScript } from "./executionHistory";

describe("isLargeExecutionHistoryScript", () => {
    it("keeps smaller snapshots in the standard editor mode", () => {
        expect(isLargeExecutionHistoryScript("print('hello world')")).toBe(
            false,
        );
    });

    it("marks snapshots as large by character count", () => {
        expect(
            isLargeExecutionHistoryScript(
                "a".repeat(EXECUTION_HISTORY_LARGE_SCRIPT_MAX_CHARACTERS),
            ),
        ).toBe(true);
    });

    it("marks snapshots as large by line count", () => {
        expect(
            isLargeExecutionHistoryScript(
                "line\n".repeat(EXECUTION_HISTORY_LARGE_SCRIPT_MAX_LINES - 1),
            ),
        ).toBe(true);
    });
});
