import {
    MAX_RECENT_WORKSPACES,
    RECENT_WORKSPACE_STORAGE_KEY,
} from "../../constants/workspace/workspace";
import type { WorkspaceSession } from "../../lib/workspace/workspace.type";
import { isString } from "../shared/validation";
import { PersistenceError } from "./errors";
import { serializeTabState } from "./session";

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
