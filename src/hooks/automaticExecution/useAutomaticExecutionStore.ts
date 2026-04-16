import { create } from "zustand";
import {
    buildAutomaticExecutionScripts,
    serializeAutomaticExecutionScriptState,
} from "../../lib/automaticExecution/automaticExecution";
import {
    bootstrapAutomaticExecution as bootstrapAutomaticExecutionCommand,
    createAutomaticExecutionScript,
    deleteAutomaticExecutionScript,
    persistAutomaticExecutionState,
    refreshAutomaticExecution,
    renameAutomaticExecutionScript,
    saveAutomaticExecutionScript,
} from "../../lib/platform/automaticExecution";
import { getErrorMessage } from "../../lib/shared/errorMessage";
import type { ExecutorKind } from "../../lib/workspace/workspace.type";
import type { AutomaticExecutionStore } from "./automaticExecutionStore.type";

export const useAutomaticExecutionStore = create<AutomaticExecutionStore>(
    (set, get) => {
        const runtime = {
            latestBootstrapRequestId: 0,
            latestRefreshRequestId: 0,
            shouldRefreshAfterFlush: false,
        };

        const applySnapshot = (
            snapshot: Awaited<
                ReturnType<typeof bootstrapAutomaticExecutionCommand>
            >,
        ): void => {
            set({
                executorKind: snapshot.executorKind,
                resolvedPath: snapshot.resolvedPath,
                scripts: buildAutomaticExecutionScripts(snapshot.scripts),
                activeScriptId: snapshot.metadata.activeScriptId,
                errorMessage: null,
                isBootstrapping: false,
                isRefreshing: false,
            });
        };

        const runRefreshAfterFlush = async (
            executorKind: ExecutorKind,
        ): Promise<void> => {
            if (!runtime.shouldRefreshAfterFlush) {
                return;
            }

            runtime.shouldRefreshAfterFlush = false;
            await get().refreshAutomaticExecution(executorKind);
        };

        return {
            executorKind: "unsupported",
            resolvedPath: null,
            scripts: [],
            activeScriptId: null,
            isBootstrapping: true,
            isRefreshing: false,
            isSaving: false,
            errorMessage: null,
            resetForExecutorKind: (executorKind): void => {
                set({
                    executorKind,
                    resolvedPath: null,
                    scripts: [],
                    activeScriptId: null,
                    isBootstrapping: executorKind !== "unsupported",
                    isRefreshing: false,
                    isSaving: false,
                    errorMessage:
                        executorKind === "unsupported"
                            ? "No supported executor detected."
                            : null,
                });
            },
            hydrateFromSnapshot: (snapshot): void => {
                applySnapshot(snapshot);
            },
            bootstrapAutomaticExecution: async (
                executorKind,
            ): Promise<void> => {
                if (executorKind === "unsupported") {
                    get().resetForExecutorKind(executorKind);
                    return;
                }

                const requestId = ++runtime.latestBootstrapRequestId;

                set({
                    executorKind,
                    isBootstrapping: true,
                    errorMessage: null,
                });

                try {
                    const snapshot =
                        await bootstrapAutomaticExecutionCommand(executorKind);

                    if (
                        requestId !== runtime.latestBootstrapRequestId ||
                        get().executorKind !== executorKind
                    ) {
                        return;
                    }

                    applySnapshot(snapshot);
                } catch (error) {
                    if (
                        requestId !== runtime.latestBootstrapRequestId ||
                        get().executorKind !== executorKind
                    ) {
                        return;
                    }

                    set({
                        resolvedPath: null,
                        scripts: [],
                        activeScriptId: null,
                        isBootstrapping: false,
                        errorMessage: getErrorMessage(
                            error,
                            "Could not load automatic execution scripts.",
                        ),
                    });
                }
            },
            refreshAutomaticExecution: async (executorKind): Promise<void> => {
                if (executorKind === "unsupported") {
                    get().resetForExecutorKind(executorKind);
                    return;
                }

                const state = get();

                if (
                    state.executorKind !== executorKind ||
                    state.isSaving ||
                    state.scripts.some(
                        (script) => script.content !== script.savedContent,
                    )
                ) {
                    runtime.shouldRefreshAfterFlush = true;
                    return;
                }

                const requestId = ++runtime.latestRefreshRequestId;
                set({ isRefreshing: true });

                try {
                    const snapshot =
                        await refreshAutomaticExecution(executorKind);

                    if (
                        requestId !== runtime.latestRefreshRequestId ||
                        get().executorKind !== executorKind
                    ) {
                        return;
                    }

                    applySnapshot(snapshot);
                } catch (error) {
                    if (
                        requestId !== runtime.latestRefreshRequestId ||
                        get().executorKind !== executorKind
                    ) {
                        return;
                    }

                    set({
                        isRefreshing: false,
                        errorMessage: getErrorMessage(
                            error,
                            "Could not refresh automatic execution scripts.",
                        ),
                    });
                }
            },
            createScript: async (executorKind): Promise<void> => {
                if (executorKind === "unsupported") {
                    get().resetForExecutorKind(executorKind);
                    return;
                }

                try {
                    const createdScript = await createAutomaticExecutionScript({
                        executorKind,
                    });

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
                const script = get().scripts.find(
                    (item) => item.id === scriptId,
                );

                if (
                    !script ||
                    script.content === script.savedContent ||
                    executorKind === "unsupported"
                ) {
                    return false;
                }

                set({ isSaving: true });

                try {
                    await saveAutomaticExecutionScript({
                        executorKind,
                        scriptId,
                        content: script.content,
                        cursor: script.cursor,
                    });

                    set((state) => ({
                        isSaving: false,
                        scripts: state.scripts.map((item) =>
                            item.id === scriptId
                                ? {
                                      ...item,
                                      savedContent: item.content,
                                  }
                                : item,
                        ),
                        errorMessage: null,
                    }));

                    await get().persistAutomaticExecutionState(executorKind);
                    await runRefreshAfterFlush(executorKind);
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
                    const didSave = await get().saveScript(
                        executorKind,
                        scriptId,
                    );
                    didSaveAnyScript = didSaveAnyScript || didSave;
                }

                await runRefreshAfterFlush(executorKind);
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
            persistAutomaticExecutionState: async (
                executorKind,
            ): Promise<boolean> => {
                if (executorKind === "unsupported") {
                    return false;
                }

                const state = get();

                try {
                    await persistAutomaticExecutionState({
                        executorKind,
                        activeScriptId: state.activeScriptId,
                        scripts: state.scripts.map(
                            serializeAutomaticExecutionScriptState,
                        ),
                    });

                    set({ errorMessage: null });
                    return true;
                } catch (error) {
                    set({
                        errorMessage: getErrorMessage(
                            error,
                            "Could not persist automatic execution metadata.",
                        ),
                    });
                    return false;
                }
            },
            updateActiveScriptContent: (content): void => {
                set((state) => ({
                    scripts: state.scripts.map((script) =>
                        script.id === state.activeScriptId
                            ? {
                                  ...script,
                                  content,
                              }
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
                                      scrollTop: Number.isFinite(
                                          cursor.scrollTop,
                                      )
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
    },
);

export const selectAutomaticExecutionActiveScript = (
    state: AutomaticExecutionStore,
) => state.scripts.find((script) => script.id === state.activeScriptId) ?? null;

export const selectAutomaticExecutionHasUnsavedChanges = (
    state: AutomaticExecutionStore,
): boolean =>
    state.scripts.some((script) => script.content !== script.savedContent);
