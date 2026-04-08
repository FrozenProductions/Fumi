import type { WorkspaceTab } from "../../lib/workspace/workspace.type";
import { buildWorkspaceFileName, splitWorkspaceFileName } from "./fileName";

const WORKSPACE_TAB_DUPLICATE_SUFFIX = " copy";
const WORKSPACE_TAB_DUPLICATE_PATTERN = / copy(?:-(\d+))?$/;

export type DuplicateWorkspaceTabDraft = {
    fileName: string;
    initialContent: string;
};

export function buildDuplicateWorkspaceTabDraft(
    tab: WorkspaceTab,
): DuplicateWorkspaceTabDraft {
    const { baseName, extension } = splitWorkspaceFileName(tab.fileName);
    const duplicateMatch = baseName.match(WORKSPACE_TAB_DUPLICATE_PATTERN);
    const sourceBaseName = duplicateMatch
        ? baseName.slice(0, -duplicateMatch[0].length)
        : baseName;
    const duplicateIndex = duplicateMatch
        ? Number.parseInt(duplicateMatch[1] ?? "1", 10) + 1
        : 1;
    const duplicateBaseName =
        duplicateIndex === 1
            ? `${sourceBaseName}${WORKSPACE_TAB_DUPLICATE_SUFFIX}`
            : `${sourceBaseName}${WORKSPACE_TAB_DUPLICATE_SUFFIX}-${duplicateIndex}`;

    return {
        fileName: buildWorkspaceFileName(duplicateBaseName, extension),
        initialContent: tab.content,
    };
}
