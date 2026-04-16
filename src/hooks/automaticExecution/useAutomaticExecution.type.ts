import type { AutomaticExecutionScript } from "../../lib/automaticExecution/automaticExecution.type";
import type { AutomaticExecutionStore } from "./automaticExecutionStore.type";

type UseAutomaticExecutionStoreFields = Pick<
    AutomaticExecutionStore,
    | "activeScriptId"
    | "clearErrorMessage"
    | "createScript"
    | "deleteScript"
    | "errorMessage"
    | "executorKind"
    | "isBootstrapping"
    | "isRefreshing"
    | "isSaving"
    | "renameScript"
    | "resolvedPath"
    | "saveScript"
    | "setErrorMessage"
    | "scripts"
    | "selectScript"
    | "updateActiveScriptContent"
    | "updateActiveScriptCursor"
>;

export type AutomaticExecutionState = Pick<
    UseAutomaticExecutionStoreFields,
    | "activeScriptId"
    | "errorMessage"
    | "executorKind"
    | "isBootstrapping"
    | "isRefreshing"
    | "isSaving"
    | "resolvedPath"
    | "scripts"
> & {
    activeScript: AutomaticExecutionScript | null;
    hasUnsavedChanges: boolean;
};

export type AutomaticExecutionActions = Pick<
    UseAutomaticExecutionStoreFields,
    | "clearErrorMessage"
    | "createScript"
    | "deleteScript"
    | "renameScript"
    | "saveScript"
    | "setErrorMessage"
    | "selectScript"
    | "updateActiveScriptContent"
    | "updateActiveScriptCursor"
>;

export type UseAutomaticExecutionResult = {
    state: AutomaticExecutionState;
    actions: AutomaticExecutionActions;
};
