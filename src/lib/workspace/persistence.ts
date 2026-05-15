import {
    MAX_RECENT_WORKSPACES,
    RECENT_WORKSPACE_STORAGE_KEY,
} from "../../constants/workspace/workspace";
import { isString } from "../shared/validation";
import { PersistenceError } from "./errors";
import type { WorkspaceSession } from "./session/session.type";
import { serializeTabState } from "./session/tabs/sessionTabs";

function logWorkspacePersistenceFailure(
    action: "read" | "write",
    error: unknown,
): void {
    console.warn(`Failed to ${action} recent workspace paths.`, error);
}

/**
 * Produces a serializable signature of the workspace state for change detection.
 */
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
        executionHistory: workspace.executionHistory,
    });
}

/**
 * Reads the recent workspace paths from localStorage, returning an empty array on failure.
 */
export function readRecentWorkspacePaths(): string[] {
    try {
        const storedValue =
            globalThis.localStorage?.getItem(RECENT_WORKSPACE_STORAGE_KEY) ??
            null;

        if (!storedValue) {
            return [];
        }

        const parsedValue = JSON.parse(storedValue);

        if (
            !Array.isArray(parsedValue) ||
            !parsedValue.every((workspacePath) => isString(workspacePath))
        ) {
            throw new PersistenceError({
                operation: "readRecentWorkspacePaths",
                message: "Recent workspace storage has an invalid shape.",
            });
        }

        return normalizeRecentWorkspacePaths(parsedValue);
    } catch (error) {
        logWorkspacePersistenceFailure("read", error);
        return [];
    }
}

/**
 * Persists the given workspace paths to localStorage.
 */
export function persistRecentWorkspacePaths(paths: string[]): void {
    try {
        globalThis.localStorage?.setItem(
            RECENT_WORKSPACE_STORAGE_KEY,
            JSON.stringify(paths),
        );
    } catch (error) {
        logWorkspacePersistenceFailure("write", error);
    }
}

/**
 * Prepends a workspace path and deduplicates, keeping within the max limit.
 */
export function updateRecentWorkspacePaths(
    currentPaths: string[],
    workspacePath: string,
): string[] {
    return normalizeRecentWorkspacePaths([workspacePath, ...currentPaths]);
}

function normalizeRecentWorkspacePaths(paths: string[]): string[] {
    const normalizedPaths: string[] = [];
    const seenPaths = new Set<string>();

    for (const path of paths) {
        const workspacePath = path.trim();

        if (!workspacePath || seenPaths.has(workspacePath)) {
            continue;
        }

        normalizedPaths.push(workspacePath);
        seenPaths.add(workspacePath);

        if (normalizedPaths.length >= MAX_RECENT_WORKSPACES) {
            return normalizedPaths;
        }
    }

    return normalizedPaths;
}
