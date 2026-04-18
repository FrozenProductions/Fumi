import {
    WORKSPACE_TAB_DUPLICATE_PATTERN,
    WORKSPACE_TAB_DUPLICATE_SUFFIX,
} from "../../constants/workspace/workspace";
import type { WorkspaceTab } from "../../lib/workspace/workspace.type";
import type { DuplicateWorkspaceTabDraft } from "./duplicate.type";
import { buildWorkspaceFileName, splitWorkspaceFileName } from "./fileName";

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
