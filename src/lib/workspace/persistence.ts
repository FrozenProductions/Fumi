import type { WorkspaceSession } from "../../types/workspace/session";
import { serializeTabState } from "./session";

const RECENT_WORKSPACE_STORAGE_KEY = "fumi-recent-workspaces";
const MAX_RECENT_WORKSPACES = 6;

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
        const storedValue = globalThis.localStorage?.getItem(
            RECENT_WORKSPACE_STORAGE_KEY,
        );

        if (!storedValue) {
            return [];
        }

        const parsedValue = JSON.parse(storedValue);

        return Array.isArray(parsedValue)
            ? normalizeRecentWorkspacePaths(
                  parsedValue.filter(
                      (workspacePath): workspacePath is string =>
                          typeof workspacePath === "string",
                  ),
              )
            : [];
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
