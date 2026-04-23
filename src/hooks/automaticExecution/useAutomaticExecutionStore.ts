import { create } from "zustand";
import type { AutomaticExecutionStore } from "../../lib/automaticExecution/automaticExecutionStore.type";
import {
    createAutomaticExecutionLifecycleActions,
    createAutomaticExecutionRuntime,
} from "./automaticExecutionStoreLifecycle";
import { createAutomaticExecutionScriptActions } from "./automaticExecutionStoreScripts";

/**
 * Zustand store for automatic execution state, combining lifecycle and script actions.
 *
 * @remarks
 * Initializes with an unsupported executor kind and empty script list. Lifecycle
 * actions (bootstrap, refresh, save) are created by `createAutomaticExecutionLifecycleActions`;
 * script actions (create, update, delete, select) by `createAutomaticExecutionScriptActions`.
 */
export const useAutomaticExecutionStore = create<AutomaticExecutionStore>(
    (set, get, _store) => {
        const runtime = createAutomaticExecutionRuntime();

        return {
            executorKind: "unsupported",
            resolvedPath: null,
            scripts: [],
            activeScriptId: null,
            isBootstrapping: true,
            isRefreshing: false,
            isSaving: false,
            errorMessage: null,
            ...createAutomaticExecutionLifecycleActions(set, get, runtime),
            ...createAutomaticExecutionScriptActions(set, get, runtime),
        };
    },
);

/**
 * Selects the currently active automatic execution script from the store state.
 *
 * @param state - The automatic execution store state
 * @returns The active script, or null if no script is active
 */
export const selectAutomaticExecutionActiveScript = (
    state: AutomaticExecutionStore,
) => state.scripts.find((script) => script.id === state.activeScriptId) ?? null;

/**
 * Checks whether any automatic execution script has unsaved local changes.
 *
 * @param state - The automatic execution store state
 * @returns True if at least one script content differs from its saved content
 */
export const selectAutomaticExecutionHasUnsavedChanges = (
    state: AutomaticExecutionStore,
): boolean =>
    state.scripts.some((script) => script.content !== script.savedContent);
