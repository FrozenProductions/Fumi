import { describe, expect, it, vi } from "vite-plus/test";
import { getGoToLineCommandPaletteItems } from "../commandPaletteModes";

describe("getGoToLineCommandPaletteItems", () => {
    it("keeps go-to-line items driven only by the parsed line target", () => {
        const onGoToLine = vi.fn();
        const [item] = getGoToLineCommandPaletteItems({
            activeTab: {
                id: "tab-1",
                fileName: "alpha.lua",
                content: "alpha",
                savedContent: "alpha",
                isDirty: false,
                cursor: { line: 0, column: 0, scrollTop: 0 },
            },
            goToLineTarget: { line: 12, column: null },
            onGoToLine,
        });

        expect(item).toMatchObject({
            id: "command-goto-line",
            label: "Go to line 12",
            description: "Jump within alpha.lua.",
            isDisabled: false,
        });

        item?.onSelect();

        expect(onGoToLine).toHaveBeenCalledWith(12, undefined);
    });

    it("shows column when provided", () => {
        const onGoToLine = vi.fn();
        const [item] = getGoToLineCommandPaletteItems({
            activeTab: {
                id: "tab-1",
                fileName: "beta.lua",
                content: "beta",
                savedContent: "beta",
                isDirty: false,
                cursor: { line: 0, column: 0, scrollTop: 0 },
            },
            goToLineTarget: { line: 5, column: 20 },
            onGoToLine,
        });

        expect(item?.label).toBe("Go to line 5:20");

        item?.onSelect();

        expect(onGoToLine).toHaveBeenCalledWith(5, 20);
    });
});
