import { describe, expect, it } from "vite-plus/test";
import { parseGoToLineQuery } from "../commandPaletteShared";

describe("parseGoToLineQuery", () => {
    it("accepts supported go-to-line formats", () => {
        expect(parseGoToLineQuery("12")).toEqual({ line: 12, column: null });
        expect(parseGoToLineQuery(":12")).toEqual({ line: 12, column: null });
        expect(parseGoToLineQuery("line 12")).toEqual({
            line: 12,
            column: null,
        });
        expect(parseGoToLineQuery("go to line 12:4")).toEqual({
            line: 12,
            column: 4,
        });
        expect(parseGoToLineQuery("15:3")).toEqual({ line: 15, column: 3 });
        expect(parseGoToLineQuery(":42:7")).toEqual({ line: 42, column: 7 });
        expect(parseGoToLineQuery("line 20:10")).toEqual({
            line: 20,
            column: 10,
        });
    });

    it("rejects empty, zero, and invalid input", () => {
        expect(parseGoToLineQuery("")).toBeNull();
        expect(parseGoToLineQuery("0")).toBeNull();
        expect(parseGoToLineQuery("line twelve")).toBeNull();
        expect(parseGoToLineQuery("12:abc")).toBeNull();
        expect(parseGoToLineQuery("0:5")).toBeNull();
    });
});
