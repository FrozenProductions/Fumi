import { killRobloxProcesses } from "../../lib/platform/accounts";
import { confirmAction } from "../../lib/platform/dialog";

/**
 * Parses a go-to-line query string into a line number.
 *
 * @remarks
 * Accepts formats like "42", ":42", "line 42", "go to line 42".
 * Returns null for empty or invalid input.
 */
export function parseGoToLineQuery(value: string): number | null {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
        return null;
    }

    const match = trimmedValue.match(
        /^(?::|line\s+|go\s+to\s+line\s+)?(\d+)(?::\d+)?$/i,
    );

    if (!match) {
        return null;
    }

    const lineNumber = Number.parseInt(match[1], 10);

    return Number.isInteger(lineNumber) && lineNumber > 0 ? lineNumber : null;
}

export async function confirmKillRobloxProcesses(): Promise<void> {
    const shouldKillRoblox = await confirmAction("Attempt to close Roblox?");

    if (!shouldKillRoblox) {
        return;
    }

    await killRobloxProcesses();
}

export function formatWorkspacePath(
    value: string | null | undefined,
): string | undefined {
    if (!value) {
        return undefined;
    }

    return value.replace(/^\/Users\/[^/]+/, "~").replace(/^\/home\/[^/]+/, "~");
}

export function getWorkspacePathLabel(workspacePath: string): string {
    const pathSegments = workspacePath.split(/[/\\]/).filter(Boolean);

    return pathSegments[pathSegments.length - 1] ?? workspacePath;
}

export function createWorkspaceCountLabel(
    tabCount: number,
    archivedTabCount: number,
): string {
    return `${tabCount} tab${tabCount === 1 ? "" : "s"} • ${archivedTabCount} archived`;
}

export function getCurrentStateMeta(
    isCurrent: boolean,
    fallbackMeta?: string,
): string | undefined {
    if (isCurrent) {
        return "Current";
    }

    return fallbackMeta;
}
