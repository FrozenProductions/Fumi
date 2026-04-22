import { describe, expect, it } from "vite-plus/test";
import { searchAppCommandPaletteItems } from "./commandPaletteSearch";
import { createAppCommandPaletteItem } from "./commandPaletteTestUtils";

describe("searchAppCommandPaletteItems", () => {
    it("ranks exact label matches above keyword-only and description-only matches", () => {
        const items = [
            createAppCommandPaletteItem({
                id: "description",
                label: "Open panel",
                description: "Adjust settings quickly.",
            }),
            createAppCommandPaletteItem({
                id: "keyword",
                label: "Open panel",
                keywords: "settings preferences configuration",
            }),
            createAppCommandPaletteItem({
                id: "label",
                label: "Settings",
            }),
        ];

        expect(
            searchAppCommandPaletteItems(items, "settings", items.length).map(
                (item) => item.id,
            ),
        ).toEqual(["label", "keyword", "description"]);
    });

    it("ranks token prefixes above generic substrings", () => {
        const items = [
            createAppCommandPaletteItem({
                id: "substring",
                label: "Breathe deeply",
            }),
            createAppCommandPaletteItem({
                id: "token-prefix",
                label: "Theme settings",
            }),
        ];

        expect(
            searchAppCommandPaletteItems(items, "the", items.length).map(
                (item) => item.id,
            ),
        ).toEqual(["token-prefix", "substring"]);
    });

    it("ranks consecutive fuzzy matches above gapped fuzzy matches", () => {
        const items = [
            createAppCommandPaletteItem({
                id: "gapped",
                label: "Orbit panel window",
            }),
            createAppCommandPaletteItem({
                id: "consecutive",
                label: "Open workspace",
            }),
        ];

        expect(
            searchAppCommandPaletteItems(items, "opw", items.length).map(
                (item) => item.id,
            ),
        ).toEqual(["consecutive", "gapped"]);
    });

    it("ranks word-boundary matches above mid-word fuzzy matches", () => {
        const items = [
            createAppCommandPaletteItem({
                id: "mid-word",
                label: "Crystal cave",
            }),
            createAppCommandPaletteItem({
                id: "boundary",
                label: "Script library",
            }),
        ];

        expect(
            searchAppCommandPaletteItems(items, "sl", items.length).map(
                (item) => item.id,
            ),
        ).toEqual(["boundary", "mid-word"]);
    });

    it("matches workspace paths containing separators through normalized tokens", () => {
        const items = [
            createAppCommandPaletteItem({
                id: "path",
                label: "Recent project",
                meta: "~/Projects/fumi.alpha_workspace/main-tab.lua",
            }),
            createAppCommandPaletteItem({
                id: "other",
                label: "Archive project",
                meta: "~/Projects/legacy/beta.lua",
            }),
        ];

        expect(
            searchAppCommandPaletteItems(
                items,
                "alpha workspace main tab",
                items.length,
            ).map((item) => item.id),
        ).toEqual(["path"]);
    });

    it("keeps alias searches working through keywords", () => {
        const items = [
            createAppCommandPaletteItem({
                id: "settings",
                label: "Open settings",
                keywords: "settings preferences configuration",
            }),
            createAppCommandPaletteItem({
                id: "workspace",
                label: "Open workspace",
                keywords: "folder files tabs",
            }),
        ];

        expect(
            searchAppCommandPaletteItems(
                items,
                "preferences",
                items.length,
            ).map((item) => item.id),
        ).toEqual(["settings"]);
    });

    it("preserves the original item order for empty queries", () => {
        const items = [
            createAppCommandPaletteItem({ id: "first", label: "First" }),
            createAppCommandPaletteItem({ id: "second", label: "Second" }),
            createAppCommandPaletteItem({ id: "third", label: "Third" }),
        ];

        expect(
            searchAppCommandPaletteItems(items, "", items.length).map(
                (item) => item.id,
            ),
        ).toEqual(["first", "second", "third"]);
    });

    it("keeps single-character queries conservative", () => {
        const items = [
            createAppCommandPaletteItem({
                id: "workspace",
                label: "Open workspace",
            }),
            createAppCommandPaletteItem({
                id: "accounts",
                label: "Manage accounts",
            }),
        ];

        expect(searchAppCommandPaletteItems(items, "z", items.length)).toEqual(
            [],
        );
    });

    it("keeps the original order when scores tie", () => {
        const items = [
            createAppCommandPaletteItem({
                id: "first",
                label: "Workspace tools",
            }),
            createAppCommandPaletteItem({
                id: "second",
                label: "Workspace tools",
            }),
        ];

        expect(
            searchAppCommandPaletteItems(items, "workspace", items.length).map(
                (item) => item.id,
            ),
        ).toEqual(["first", "second"]);
    });

    it("caps the result count to the requested limit", () => {
        const items = [
            createAppCommandPaletteItem({ id: "1", label: "Tab one" }),
            createAppCommandPaletteItem({ id: "2", label: "Tab two" }),
            createAppCommandPaletteItem({ id: "3", label: "Tab three" }),
            createAppCommandPaletteItem({ id: "4", label: "Tab four" }),
            createAppCommandPaletteItem({ id: "5", label: "Tab five" }),
            createAppCommandPaletteItem({ id: "6", label: "Tab six" }),
        ];

        expect(searchAppCommandPaletteItems(items, "tab", 5)).toHaveLength(5);
    });
});
