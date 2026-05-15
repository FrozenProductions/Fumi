import type { StateCreator } from "zustand";
import type { ExecutorKind } from "../workspace/executor/executor.type";
import type {
    AutomaticExecutionCursorState,
    AutomaticExecutionScript,
    AutomaticExecutionSnapshot,
} from "./automaticExecution.type";

type AutomaticExecutionStoreState = {
    executorKind: ExecutorKind;
    resolvedPath: string | null;
    scripts: AutomaticExecutionScript[];
    activeScriptId: string | null;
    isBootstrapping: boolean;
    isRefreshing: boolean;
    isSaving: boolean;
    errorMessage: string | null;
};

type AutomaticExecutionStoreActions = {
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
