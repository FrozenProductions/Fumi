import {
    buildAutomaticExecutionScripts,
    serializeAutomaticExecutionScriptState,
} from "../../lib/automaticExecution/automaticExecution";
import type { AutomaticExecutionSnapshot } from "../../lib/automaticExecution/automaticExecution.type";
import type {
    AutomaticExecutionStore,
    AutomaticExecutionStoreGet,
    AutomaticExecutionStoreSet,
} from "../../lib/automaticExecution/automaticExecutionStore.type";
import {
    bootstrapAutomaticExecution as bootstrapAutomaticExecutionCommand,
    persistAutomaticExecutionState,
    refreshAutomaticExecution,
} from "../../lib/platform/automaticExecution";
import { getErrorMessage } from "../../lib/shared/errorMessage";
import type { ExecutorKind } from "../../lib/workspace/workspace.type";

export type AutomaticExecutionRuntime = {
    latestBootstrapRequestId: number;
    latestRefreshRequestId: number;
    shouldRefreshAfterFlush: boolean;
};

/**
 * Creates a fresh automatic execution runtime tracking object.
 *
 * @returns A new runtime instance with reset request counters and flush flags
 */
export function createAutomaticExecutionRuntime(): AutomaticExecutionRuntime {
    return {
        latestBootstrapRequestId: 0,
        latestRefreshRequestId: 0,
        shouldRefreshAfterFlush: false,
    };
}

/**
 * Applies a bootstrap or refresh snapshot to the store, replacing executor kind,
 * scripts, and active script selection.
 *
 * @param set - Zustand state setter
 * @param snapshot - The snapshot returned by the backend
 */
export function applyAutomaticExecutionSnapshot(
    set: AutomaticExecutionStoreSet,
    snapshot: AutomaticExecutionSnapshot,
): void {
    set({
        executorKind: snapshot.executorKind,
        resolvedPath: snapshot.resolvedPath,
        scripts: buildAutomaticExecutionScripts(snapshot.scripts),
        activeScriptId: snapshot.metadata.activeScriptId,
        errorMessage: null,
        isBootstrapping: false,
        isRefreshing: false,
    });
}

/**
 * Triggers a refresh after a flush if one was deferred, clearing the pending flag.
 *
 * @param get - Zustand state getter
 * @param runtime - Shared runtime tracking flush and request state
 * @param executorKind - The current executor kind to refresh
 */
export async function runRefreshAfterFlush(
    get: AutomaticExecutionStoreGet,
    runtime: AutomaticExecutionRuntime,
    executorKind: ExecutorKind,
): Promise<void> {
    if (!runtime.shouldRefreshAfterFlush) {
        return;
    }

    runtime.shouldRefreshAfterFlush = false;
    await get().refreshAutomaticExecution(executorKind);
}

/**
 * Creates the lifecycle action slice for the automatic execution store.
 *
 * Includes reset, hydration, bootstrap, refresh, and persist actions.
 *
 * @param set - Zustand state setter
 * @param get - Zustand state getter
 * @param runtime - Shared runtime tracking request IDs and flush flags
 * @returns An object containing lifecycle action implementations
 */
export function createAutomaticExecutionLifecycleActions(
    set: AutomaticExecutionStoreSet,
    get: AutomaticExecutionStoreGet,
    runtime: AutomaticExecutionRuntime,
): Pick<
    AutomaticExecutionStore,
    | "resetForExecutorKind"
    | "hydrateFromSnapshot"
    | "bootstrapAutomaticExecution"
    | "refreshAutomaticExecution"
    | "persistAutomaticExecutionState"
> {
    return {
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
            applyAutomaticExecutionSnapshot(set, snapshot);
        },
        bootstrapAutomaticExecution: async (executorKind): Promise<void> => {
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

                applyAutomaticExecutionSnapshot(set, snapshot);
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
                const snapshot = await refreshAutomaticExecution(executorKind);

                if (
                    requestId !== runtime.latestRefreshRequestId ||
                    get().executorKind !== executorKind
                ) {
                    return;
                }

                applyAutomaticExecutionSnapshot(set, snapshot);
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
    };
}
