import type {
    ScriptLibraryActivityState,
    ScriptLibraryViewActions,
    ScriptLibraryViewState,
} from "./useScriptLibraryStore.type";

export type UseScriptLibraryResult = {
    state: ScriptLibraryViewState & {
        hasActiveFilters: boolean;
    };
    activity: ScriptLibraryActivityState;
    actions: ScriptLibraryViewActions;
};
