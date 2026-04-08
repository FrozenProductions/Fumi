import { describe, expect, it } from "vite-plus/test";
import { DEFAULT_SCRIPT_LIBRARY_FILTERS } from "../../constants/scriptLibrary/scriptLibrary";
import {
    getVisibleScriptLibraryEntries,
    normalizeScriptLibraryFavoriteEntry,
} from "./scriptLibrary";
import type { ScriptLibraryEntry } from "./scriptLibrary.type";

function createScriptLibraryEntry(
    overrides: Partial<ScriptLibraryEntry> = {},
): ScriptLibraryEntry {
    return {
        _id: "script-1",
        title: "Velocity Hub",
        description: "Fast traversal tools for open world games.",
        createdAt: "2026-01-02T00:00:00.000Z",
        views: 180,
        likes: 90,
        slug: "velocity-hub",
        rawScript: null,
        image: null,
        paid: false,
        keySystem: false,
        mobileReady: true,
        unpatched: true,
        creator: {
            name: "dayte",
            image: null,
            verified: true,
        },
        ...overrides,
    };
}

describe("normalizeScriptLibraryFavoriteEntry", () => {
    it("copies nested creator data so favorite snapshots stay local to the save moment", () => {
        const script = createScriptLibraryEntry();
        const favoriteEntry = normalizeScriptLibraryFavoriteEntry(script);

        script.creator.name = "changed";

        expect(favoriteEntry).toEqual(
            expect.objectContaining({
                _id: "script-1",
                creator: expect.objectContaining({
                    name: "dayte",
                }),
            }),
        );
    });
});

describe("getVisibleScriptLibraryEntries", () => {
    const favoriteScripts = [
        createScriptLibraryEntry(),
        createScriptLibraryEntry({
            _id: "script-2",
            title: "Aether Farm",
            description: "Auto farm route pack.",
            createdAt: "2026-03-04T00:00:00.000Z",
            views: 260,
            likes: 30,
            slug: "aether-farm",
            keySystem: true,
            unpatched: false,
            creator: {
                name: "builder",
                image: null,
                verified: false,
            },
        }),
        createScriptLibraryEntry({
            _id: "script-3",
            title: "Zenith Drift",
            description: "Verified speed path.",
            createdAt: "2025-12-20T00:00:00.000Z",
            views: 120,
            likes: 150,
            slug: "zenith-drift",
            paid: true,
            keySystem: false,
            unpatched: true,
            creator: {
                name: "orbit",
                image: null,
                verified: true,
            },
        }),
    ];

    it("applies local search, filters, and sort order for favorites mode", () => {
        expect(
            getVisibleScriptLibraryEntries(favoriteScripts, {
                query: "dr",
                filters: DEFAULT_SCRIPT_LIBRARY_FILTERS,
                orderBy: "likes",
            }).map((script) => script._id),
        ).toEqual(["script-3"]);

        expect(
            getVisibleScriptLibraryEntries(favoriteScripts, {
                query: "",
                filters: {
                    ...DEFAULT_SCRIPT_LIBRARY_FILTERS,
                    verified: true,
                    keyless: true,
                },
                orderBy: "date",
            }).map((script) => script._id),
        ).toEqual(["script-1", "script-3"]);

        expect(
            getVisibleScriptLibraryEntries(favoriteScripts, {
                query: "",
                filters: DEFAULT_SCRIPT_LIBRARY_FILTERS,
                orderBy: "views",
            }).map((script) => script._id),
        ).toEqual(["script-2", "script-1", "script-3"]);
    });
});
