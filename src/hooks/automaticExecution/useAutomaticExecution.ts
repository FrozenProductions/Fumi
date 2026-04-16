import type { UseAutomaticExecutionResult } from "./useAutomaticExecution.type";
import { useAutomaticExecutionStore } from "./useAutomaticExecutionStore";

export function useAutomaticExecution(): UseAutomaticExecutionResult {
    const executorKind = useAutomaticExecutionStore(
        (state) => state.executorKind,
    );
    const resolvedPath = useAutomaticExecutionStore(
        (state) => state.resolvedPath,
    );
    const scripts = useAutomaticExecutionStore((state) => state.scripts);
    const activeScriptId = useAutomaticExecutionStore(
        (state) => state.activeScriptId,
    );
    const isBootstrapping = useAutomaticExecutionStore(
        (state) => state.isBootstrapping,
    );
    const isRefreshing = useAutomaticExecutionStore(
        (state) => state.isRefreshing,
    );
    const isSaving = useAutomaticExecutionStore((state) => state.isSaving);
    const errorMessage = useAutomaticExecutionStore(
        (state) => state.errorMessage,
    );
    const createScript = useAutomaticExecutionStore(
        (state) => state.createScript,
    );
    const selectScript = useAutomaticExecutionStore(
        (state) => state.selectScript,
    );
    const saveScript = useAutomaticExecutionStore((state) => state.saveScript);
    const renameScript = useAutomaticExecutionStore(
        (state) => state.renameScript,
    );
    const deleteScript = useAutomaticExecutionStore(
        (state) => state.deleteScript,
    );
    const updateActiveScriptContent = useAutomaticExecutionStore(
        (state) => state.updateActiveScriptContent,
    );
    const updateActiveScriptCursor = useAutomaticExecutionStore(
        (state) => state.updateActiveScriptCursor,
    );
    const clearErrorMessage = useAutomaticExecutionStore(
        (state) => state.clearErrorMessage,
    );
    const setErrorMessage = useAutomaticExecutionStore(
        (state) => state.setErrorMessage,
    );
    const activeScript =
        scripts.find((script) => script.id === activeScriptId) ?? null;
    const hasUnsavedChanges = scripts.some(
        (script) => script.content !== script.savedContent,
    );

    return {
        state: {
            executorKind,
            resolvedPath,
            scripts,
            activeScriptId,
            activeScript,
            isBootstrapping,
            isRefreshing,
            isSaving,
            errorMessage,
            hasUnsavedChanges,
        },
        actions: {
            clearErrorMessage,
            createScript,
            selectScript,
            saveScript,
            renameScript,
            deleteScript,
            setErrorMessage,
            updateActiveScriptContent,
            updateActiveScriptCursor,
        },
    };
}
