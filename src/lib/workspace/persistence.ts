import { Effect, Schema } from "effect";
import type { WorkspaceSession } from "../../lib/workspace/workspace.type";
import { runSync } from "../shared/effectRuntime";
import { getUnknownCauseMessage } from "../shared/errorMessage";
import { decodeUnknownWithSchema } from "../shared/schema";
import { PersistenceError } from "./errors";
import { serializeTabState } from "./session";

const RECENT_WORKSPACE_STORAGE_KEY = "fumi-recent-workspaces";
const MAX_RECENT_WORKSPACES = 6;
const RecentWorkspacePathsSchema = Schema.Array(Schema.String);

let lastPersistedWorkspaceSignature: string | null = null;

function logWorkspacePersistenceFailure(
    action: "read" | "write",
    error: unknown,
): void {
    console.warn(`Failed to ${action} recent workspace paths.`, error);
}

export function getWorkspacePersistSignature(
    workspace: WorkspaceSession | null,
): string | null {
    if (!workspace) {
        return null;
    }

    return JSON.stringify({
        workspacePath: workspace.workspacePath,
        activeTabId: workspace.activeTabId,
        splitView: workspace.splitView,
        tabs: workspace.tabs.map(serializeTabState),
        archivedTabs: workspace.archivedTabs,
    });
}

export function getLastPersistedWorkspaceSignature(): string | null {
    return lastPersistedWorkspaceSignature;
}

export function markWorkspacePersistedSignature(
    signature: string | null,
): void {
    lastPersistedWorkspaceSignature = signature;
}

export function readRecentWorkspacePaths(): string[] {
    return runSync(
        readRecentWorkspacePathsEffect().pipe(
            Effect.catchAll((error) => {
                return Effect.sync(() => {
                    logWorkspacePersistenceFailure("read", error);
                    return [];
                });
            }),
        ),
    );
}

export function persistRecentWorkspacePaths(paths: string[]): void {
    runSync(
        persistRecentWorkspacePathsEffect(paths).pipe(
            Effect.catchAll((error) => {
                return Effect.sync(() => {
                    logWorkspacePersistenceFailure("write", error);
                });
            }),
        ),
    );
}

export function updateRecentWorkspacePaths(
    currentPaths: string[],
    workspacePath: string,
): string[] {
    return normalizeRecentWorkspacePaths([workspacePath, ...currentPaths]);
}

function normalizeRecentWorkspacePaths(paths: string[]): string[] {
    return paths
        .map((workspacePath) => workspacePath.trim())
        .filter((workspacePath, index, items) => {
            return (
                workspacePath.length > 0 &&
                items.indexOf(workspacePath) === index
            );
        })
        .slice(0, MAX_RECENT_WORKSPACES);
}

export function readRecentWorkspacePathsEffect(): Effect.Effect<
    string[],
    PersistenceError
> {
    return Effect.try({
        try: () =>
            globalThis.localStorage?.getItem(RECENT_WORKSPACE_STORAGE_KEY) ??
            null,
        catch: (error) =>
            new PersistenceError({
                operation: "readRecentWorkspacePaths",
                message: getUnknownCauseMessage(
                    error,
                    "Could not access recent workspace storage.",
                ),
            }),
    }).pipe(
        Effect.flatMap((storedValue) => {
            if (!storedValue) {
                return Effect.succeed([]);
            }

            return Effect.try({
                try: () => JSON.parse(storedValue),
                catch: (error) =>
                    new PersistenceError({
                        operation: "readRecentWorkspacePaths",
                        message: getUnknownCauseMessage(
                            error,
                            "Could not parse recent workspace storage.",
                        ),
                    }),
            }).pipe(
                Effect.flatMap((parsedValue) =>
                    decodeUnknownWithSchema(
                        RecentWorkspacePathsSchema,
                        parsedValue,
                        () =>
                            new PersistenceError({
                                operation: "readRecentWorkspacePaths",
                                message:
                                    "Recent workspace storage has an invalid shape.",
                            }),
                    ),
                ),
                Effect.map((paths) => Array.from(paths)),
            );
        }),
        Effect.map(normalizeRecentWorkspacePaths),
    );
}

export function persistRecentWorkspacePathsEffect(
    paths: string[],
): Effect.Effect<void, PersistenceError> {
    return Effect.try({
        try: () => {
            globalThis.localStorage?.setItem(
                RECENT_WORKSPACE_STORAGE_KEY,
                JSON.stringify(paths),
            );
        },
        catch: (error) =>
            new PersistenceError({
                operation: "persistRecentWorkspacePaths",
                message: getUnknownCauseMessage(
                    error,
                    "Could not write recent workspace storage.",
                ),
            }),
    });
}
