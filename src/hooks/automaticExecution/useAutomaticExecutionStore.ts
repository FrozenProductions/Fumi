import { create } from "zustand";
import type { AutomaticExecutionStore } from "../../lib/automaticExecution/automaticExecutionStore.type";
import {
    createAutomaticExecutionLifecycleActions,
    createAutomaticExecutionRuntime,
} from "./automaticExecutionStoreLifecycle";
import { createAutomaticExecutionScriptActions } from "./automaticExecutionStoreScripts";

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

export const selectAutomaticExecutionActiveScript = (
    state: AutomaticExecutionStore,
) => state.scripts.find((script) => script.id === state.activeScriptId) ?? null;

export const selectAutomaticExecutionHasUnsavedChanges = (
    state: AutomaticExecutionStore,
): boolean =>
    state.scripts.some((script) => script.content !== script.savedContent);
