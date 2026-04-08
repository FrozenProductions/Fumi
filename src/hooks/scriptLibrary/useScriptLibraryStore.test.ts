import { describe, expect, it } from "vite-plus/test";
import { create } from "zustand";
import { DEFAULT_SCRIPT_LIBRARY_FILTERS } from "../../constants/scriptLibrary/scriptLibrary";
import type { ScriptLibraryEntry } from "../../lib/scriptLibrary/scriptLibrary.type";
import {
    createScriptLibraryStoreStateCreator,
    getDefaultScriptLibraryStoreState,
    getPersistedScriptLibraryStoreState,
} from "./useScriptLibraryStore";
import type { ScriptLibraryStore } from "./useScriptLibraryStore.type";

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

function createTestScriptLibraryStore() {
    return create<ScriptLibraryStore>()(createScriptLibraryStoreStateCreator);
}

describe("useScriptLibraryStore favorites", () => {
    it("adds a normalized favorite once and removes it on the next toggle", () => {
        const useTestStore = createTestScriptLibraryStore();
        const script = createScriptLibraryEntry();

        useTestStore.getState().toggleFavorite(script);
        script.creator.name = "changed";

        expect(useTestStore.getState().favoriteScripts).toEqual([
            expect.objectContaining({
                _id: "script-1",
                creator: expect.objectContaining({
                    name: "dayte",
                }),
            }),
        ]);

        useTestStore.getState().toggleFavorite(script);

        expect(useTestStore.getState().favoriteScripts).toEqual([]);
    });

    it("clears favorites without touching other persisted script-library preferences", () => {
        const useTestStore = createTestScriptLibraryStore();
        const script = createScriptLibraryEntry();

        useTestStore.setState({
            filters: {
                ...DEFAULT_SCRIPT_LIBRARY_FILTERS,
                verified: true,
            },
            orderBy: "likes",
            viewFormat: "list",
        });

        useTestStore.getState().toggleFavorite(script);
        useTestStore.getState().clearFavorites();

        expect(useTestStore.getState().favoriteScripts).toEqual([]);
        expect(useTestStore.getState().filters).toEqual({
            ...DEFAULT_SCRIPT_LIBRARY_FILTERS,
            verified: true,
        });
        expect(useTestStore.getState().orderBy).toBe("likes");
        expect(useTestStore.getState().viewFormat).toBe("list");
    });

    it("restores favorite snapshots from the persisted slice without persisting favorites mode", () => {
        const useTestStore = createTestScriptLibraryStore();
        const script = createScriptLibraryEntry();

        useTestStore.getState().setContentMode("favorites");
        useTestStore.getState().toggleFavorite(script);

        const persistedState = getPersistedScriptLibraryStoreState(
            useTestStore.getState(),
        );
        const restoredState = {
            ...getDefaultScriptLibraryStoreState(),
            ...persistedState,
        };

        expect("contentMode" in persistedState).toBe(false);
        expect(restoredState.contentMode).toBe("browse");
        expect(restoredState.favoriteScripts).toEqual([
            expect.objectContaining({
                _id: "script-1",
            }),
        ]);
    });
});
