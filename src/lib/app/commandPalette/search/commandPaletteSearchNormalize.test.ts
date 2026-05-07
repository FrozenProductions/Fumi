import { describe, expect, it } from "vite-plus/test";
import { normalizeAppCommandPaletteSearchValue } from "./commandPaletteSearch";

describe("normalizeAppCommandPaletteSearchValue", () => {
    it("trims and lowercases the query", () => {
        expect(normalizeAppCommandPaletteSearchValue("  Go To Line  ")).toBe(
            "go to line",
        );
    });

    it("collapses whitespace and normalizes path-like separators", () => {
        expect(
            normalizeAppCommandPaletteSearchValue(
                "  Fumi.alpha_workspace//Main-Tab  ",
            ),
        ).toBe("fumi alpha workspace main tab");
    });
});
