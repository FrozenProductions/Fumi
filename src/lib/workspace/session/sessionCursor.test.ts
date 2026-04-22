import { describe, expect, it } from "vite-plus/test";
import { clampCursorToContent } from "./session";

describe("clampCursorToContent", () => {
    it("clamps the line, column, and scroll position to valid content bounds", () => {
        expect(
            clampCursorToContent("abc\nde", {
                line: 10,
                column: 20,
                scrollTop: -8,
            }),
        ).toEqual({
            line: 1,
            column: 2,
            scrollTop: 0,
        });
    });

    it("clamps to the final unterminated line without allocating split line arrays", () => {
        expect(
            clampCursorToContent("alpha\nbeta\ngamma", {
                line: 40,
                column: 40,
                scrollTop: 12,
            }),
        ).toEqual({
            line: 2,
            column: 5,
            scrollTop: 12,
        });
    });
});
