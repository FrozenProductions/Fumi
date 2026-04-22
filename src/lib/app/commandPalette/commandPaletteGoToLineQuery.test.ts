import { describe, expect, it } from "vite-plus/test";
import { parseGoToLineQuery } from "./commandPalette";

describe("parseGoToLineQuery", () => {
    it("accepts supported go-to-line formats", () => {
        expect(parseGoToLineQuery("12")).toBe(12);
        expect(parseGoToLineQuery(":12")).toBe(12);
        expect(parseGoToLineQuery("line 12")).toBe(12);
        expect(parseGoToLineQuery("go to line 12:4")).toBe(12);
    });

    it("rejects empty, zero, and invalid input", () => {
        expect(parseGoToLineQuery("")).toBeNull();
        expect(parseGoToLineQuery("0")).toBeNull();
        expect(parseGoToLineQuery("line twelve")).toBeNull();
        expect(parseGoToLineQuery("12:abc")).toBeNull();
    });
});
