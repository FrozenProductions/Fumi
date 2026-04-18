import { describe, expect, it } from "vite-plus/test";
import {
    EXECUTION_HISTORY_PLAIN_TEXT_PREVIEW_MAX_CHARACTERS,
    EXECUTION_HISTORY_PLAIN_TEXT_PREVIEW_MAX_LINES,
} from "../../constants/workspace/executionHistory";
import { shouldUsePlainTextExecutionHistoryPreview } from "./executionHistory";

describe("shouldUsePlainTextExecutionHistoryPreview", () => {
    it("keeps smaller snapshots in Ace preview mode", () => {
        expect(
            shouldUsePlainTextExecutionHistoryPreview("print('hello world')"),
        ).toBe(false);
    });

    it("falls back to plain-text preview for large snapshots by character count", () => {
        expect(
            shouldUsePlainTextExecutionHistoryPreview(
                "a".repeat(EXECUTION_HISTORY_PLAIN_TEXT_PREVIEW_MAX_CHARACTERS),
            ),
        ).toBe(true);
    });

    it("falls back to plain-text preview for large snapshots by line count", () => {
        expect(
            shouldUsePlainTextExecutionHistoryPreview(
                "line\n".repeat(
                    EXECUTION_HISTORY_PLAIN_TEXT_PREVIEW_MAX_LINES - 1,
                ),
            ),
        ).toBe(true);
    });
});
