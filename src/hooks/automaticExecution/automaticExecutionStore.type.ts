import type { StateCreator } from "zustand";
import type {
    AutomaticExecutionCursorState,
    AutomaticExecutionScript,
    AutomaticExecutionScriptState,
    AutomaticExecutionSnapshot,
} from "../../lib/automaticExecution/automaticExecution.type";
import type { ExecutorKind } from "../../lib/workspace/workspace.type";

export type AutomaticExecutionStoreState = {
    executorKind: ExecutorKind;
    resolvedPath: string | null;
    scripts: AutomaticExecutionScript[];
    activeScriptId: string | null;
    isBootstrapping: boolean;
    isRefreshing: boolean;
    isSaving: boolean;
    errorMessage: string | null;
};

export type AutomaticExecutionStoreActions = {
    resetForExecutorKind: (executorKind: ExecutorKind) => void;
    hydrateFromSnapshot: (snapshot: AutomaticExecutionSnapshot) => void;
    bootstrapAutomaticExecution: (executorKind: ExecutorKind) => Promise<void>;
    refreshAutomaticExecution: (executorKind: ExecutorKind) => Promise<void>;
    createScript: (executorKind: ExecutorKind) => Promise<void>;
    selectScript: (scriptId: string) => Promise<void>;
    saveScript: (
        executorKind: ExecutorKind,
        scriptId: string,
    ) => Promise<boolean>;
    flushDirtyScripts: (executorKind: ExecutorKind) => Promise<boolean>;
    renameScript: (
        executorKind: ExecutorKind,
        scriptId: string,
        fileName: string,
    ) => Promise<boolean>;
    deleteScript: (
        executorKind: ExecutorKind,
        scriptId: string,
    ) => Promise<boolean>;
    persistAutomaticExecutionState: (
        executorKind: ExecutorKind,
    ) => Promise<boolean>;
    updateActiveScriptContent: (content: string) => void;
    updateActiveScriptCursor: (cursor: AutomaticExecutionCursorState) => void;
    clearErrorMessage: () => void;
    setErrorMessage: (message: string | null) => void;
};

export type AutomaticExecutionStore = AutomaticExecutionStoreState &
    AutomaticExecutionStoreActions;

export type AutomaticExecutionStoreSet = Parameters<
    StateCreator<AutomaticExecutionStore>
>[0];
export type AutomaticExecutionStoreGet = Parameters<
    StateCreator<AutomaticExecutionStore>
>[1];
export type AutomaticExecutionStoreApi = Parameters<
    StateCreator<AutomaticExecutionStore>
>[2];

export type AutomaticExecutionStoreSliceCreator<TSlice> = (
    set: AutomaticExecutionStoreSet,
    get: AutomaticExecutionStoreGet,
    store: AutomaticExecutionStoreApi,
) => TSlice;

export type AutomaticExecutionPersistPayload = {
    activeScriptId: string | null;
    scripts: AutomaticExecutionScriptState[];
};
