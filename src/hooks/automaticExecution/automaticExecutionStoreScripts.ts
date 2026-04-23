import type {
    AutomaticExecutionStore,
    AutomaticExecutionStoreGet,
    AutomaticExecutionStoreSet,
} from "../../lib/automaticExecution/automaticExecutionStore.type";
import {
    createAutomaticExecutionScript,
    deleteAutomaticExecutionScript,
    renameAutomaticExecutionScript,
    saveAutomaticExecutionScript,
} from "../../lib/platform/automaticExecution";
import { getErrorMessage } from "../../lib/shared/errorMessage";
import type { AutomaticExecutionRuntime } from "./automaticExecutionStoreLifecycle";
import { runRefreshAfterFlush } from "./automaticExecutionStoreLifecycle";

export function createAutomaticExecutionScriptActions(
    set: AutomaticExecutionStoreSet,
    get: AutomaticExecutionStoreGet,
    runtime: AutomaticExecutionRuntime,
): Pick<
    AutomaticExecutionStore,
    | "createScript"
    | "selectScript"
    | "saveScript"
    | "flushDirtyScripts"
    | "renameScript"
    | "deleteScript"
    | "updateActiveScriptContent"
    | "updateActiveScriptCursor"
    | "clearErrorMessage"
    | "setErrorMessage"
> {
    return {
        createScript: async (executorKind): Promise<void> => {
            if (executorKind === "unsupported") {
                get().resetForExecutorKind(executorKind);
                return;
            }

            try {
                const createdScript = await createAutomaticExecutionScript({
                    executorKind,
                });

                if (get().executorKind !== executorKind) {
                    return;
                }

                set((state) => ({
                    activeScriptId: createdScript.id,
                    scripts: [
                        ...state.scripts,
                        {
                            ...createdScript,
                            savedContent: createdScript.content,
                        },
                    ],
                    errorMessage: null,
                }));
                await get().persistAutomaticExecutionState(executorKind);
            } catch (error) {
                set({
                    errorMessage: getErrorMessage(
                        error,
                        "Could not create the automatic execution script.",
                    ),
                });
            }
        },
        selectScript: async (scriptId): Promise<void> => {
            const { executorKind } = get();
            if (scriptId === get().activeScriptId) {
                return;
            }

            set({
                activeScriptId: scriptId,
                errorMessage: null,
            });

            if (executorKind !== "unsupported") {
                await get().persistAutomaticExecutionState(executorKind);
            }
        },
        saveScript: async (executorKind, scriptId): Promise<boolean> => {
            const script = get().scripts.find((item) => item.id === scriptId);

            if (
                !script ||
                script.content === script.savedContent ||
                executorKind === "unsupported"
            ) {
                return false;
            }

            const persistedContent = script.content;
            set({ isSaving: true });

            try {
                await saveAutomaticExecutionScript({
                    executorKind,
                    scriptId,
                    content: persistedContent,
                    cursor: script.cursor,
                });

                set((state) => ({
                    isSaving: false,
                    scripts: state.scripts.map((item) =>
                        item.id === scriptId
                            ? {
                                  ...item,
                                  savedContent: persistedContent,
                              }
                            : item,
                    ),
                    errorMessage: null,
                }));

                await get().persistAutomaticExecutionState(executorKind);
                await runRefreshAfterFlush(get, runtime, executorKind);
                return true;
            } catch (error) {
                set({
                    isSaving: false,
                    errorMessage: getErrorMessage(
                        error,
                        "Could not save the automatic execution script.",
                    ),
                });
                return false;
            }
        },
        flushDirtyScripts: async (executorKind): Promise<boolean> => {
            if (executorKind === "unsupported") {
                return false;
            }

            const dirtyScriptIds = get()
                .scripts.filter(
                    (script) => script.content !== script.savedContent,
                )
                .map((script) => script.id);

            let didSaveAnyScript = false;

            for (const scriptId of dirtyScriptIds) {
                const didSave = await get().saveScript(executorKind, scriptId);
                didSaveAnyScript = didSaveAnyScript || didSave;
            }

            await runRefreshAfterFlush(get, runtime, executorKind);
            return didSaveAnyScript;
        },
        renameScript: async (
            executorKind,
            scriptId,
            fileName,
        ): Promise<boolean> => {
            if (executorKind === "unsupported") {
                return false;
            }

            try {
                const renamedScript = await renameAutomaticExecutionScript({
                    executorKind,
                    scriptId,
                    fileName,
                });

                set((state) => ({
                    scripts: state.scripts.map((script) =>
                        script.id === scriptId
                            ? {
                                  ...script,
                                  fileName: renamedScript.fileName,
                                  cursor: renamedScript.cursor,
                              }
                            : script,
                    ),
                    errorMessage: null,
                }));
                await get().persistAutomaticExecutionState(executorKind);
                return true;
            } catch (error) {
                set({
                    errorMessage: getErrorMessage(
                        error,
                        "Could not rename the automatic execution script.",
                    ),
                });
                return false;
            }
        },
        deleteScript: async (executorKind, scriptId): Promise<boolean> => {
            if (executorKind === "unsupported") {
                return false;
            }

            try {
                await deleteAutomaticExecutionScript({
                    executorKind,
                    scriptId,
                });

                set((state) => {
                    const nextScripts = state.scripts.filter(
                        (script) => script.id !== scriptId,
                    );

                    return {
                        scripts: nextScripts,
                        activeScriptId:
                            state.activeScriptId === scriptId
                                ? (nextScripts[0]?.id ?? null)
                                : state.activeScriptId,
                        errorMessage: null,
                    };
                });
                await get().persistAutomaticExecutionState(executorKind);
                return true;
            } catch (error) {
                set({
                    errorMessage: getErrorMessage(
                        error,
                        "Could not delete the automatic execution script.",
                    ),
                });
                return false;
            }
        },
        updateActiveScriptContent: (content): void => {
            set((state) => ({
                scripts: state.scripts.map((script) =>
                    script.id === state.activeScriptId
                        ? { ...script, content }
                        : script,
                ),
            }));
        },
        updateActiveScriptCursor: (cursor): void => {
            set((state) => ({
                scripts: state.scripts.map((script) =>
                    script.id === state.activeScriptId
                        ? {
                              ...script,
                              cursor: {
                                  line: Math.max(0, cursor.line),
                                  column: Math.max(0, cursor.column),
                                  scrollTop: Number.isFinite(cursor.scrollTop)
                                      ? Math.max(0, cursor.scrollTop)
                                      : 0,
                              },
                          }
                        : script,
                ),
            }));
        },
        clearErrorMessage: (): void => {
            set({ errorMessage: null });
        },
        setErrorMessage: (message): void => {
            set({ errorMessage: message });
        },
    };
}
