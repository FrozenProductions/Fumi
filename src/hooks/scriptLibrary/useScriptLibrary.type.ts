import type {
    ScriptLibraryActivityState,
    ScriptLibraryViewActions,
    ScriptLibraryViewState,
} from "./useScriptLibraryStore.type";

export type UseScriptLibraryResult = {
    state: ScriptLibraryViewState & {
        favoriteCount: number;
        favoriteIds: Set<string>;
        hasActiveFilters: boolean;
    };
    activity: ScriptLibraryActivityState;
    actions: ScriptLibraryViewActions;
};
