import { describe, expect, it, vi } from "vite-plus/test";
import { getGoToLineCommandPaletteItems } from "../commandPalette";

describe("getGoToLineCommandPaletteItems", () => {
    it("keeps go-to-line items driven only by the parsed line number", () => {
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
            goToLineNumber: 12,
            onGoToLine,
        });

        expect(item).toMatchObject({
            id: "command-goto-line",
            label: "Go to line 12",
            description: "Jump within alpha.lua.",
            isDisabled: false,
        });

        item?.onSelect();

        expect(onGoToLine).toHaveBeenCalledWith(12);
    });
});
