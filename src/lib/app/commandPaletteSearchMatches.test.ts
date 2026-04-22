import { FolderOpenIcon } from "@hugeicons/core-free-icons";
import { describe, expect, it, vi } from "vite-plus/test";
import type { AppCommandPaletteItem } from "./app.type";
import { matchesAppCommandPaletteItem } from "./commandPaletteSearch";

describe("matchesAppCommandPaletteItem", () => {
    it("matches across label, description, keywords, and meta fields", () => {
        const item: AppCommandPaletteItem = {
            id: "command-open-settings",
            label: "Open settings",
            description: "Adjust the editor and app preferences.",
            icon: FolderOpenIcon,
            meta: "Mod+,",
            keywords: "settings preferences configuration",
            onSelect: vi.fn(),
        };

        expect(matchesAppCommandPaletteItem(item, "settings")).toBe(true);
        expect(matchesAppCommandPaletteItem(item, "preferences")).toBe(true);
        expect(matchesAppCommandPaletteItem(item, "mod+,")).toBe(true);
        expect(matchesAppCommandPaletteItem(item, "missing")).toBe(false);
    });
});
