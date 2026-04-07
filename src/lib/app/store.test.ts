import { describe, expect, it } from "vite-plus/test";
import { normalizeAppMiddleClickTabAction } from "./store";

describe("normalizeAppMiddleClickTabAction", () => {
    it("keeps supported tab middle-click actions", () => {
        expect(normalizeAppMiddleClickTabAction("archive")).toBe("archive");
        expect(normalizeAppMiddleClickTabAction("delete")).toBe("delete");
    });

    it("falls back to archive for missing or invalid values", () => {
        expect(normalizeAppMiddleClickTabAction(undefined)).toBe("archive");
        expect(normalizeAppMiddleClickTabAction("close")).toBe("archive");
    });
});
