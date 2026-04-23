import { MAX_WORKSPACE_TAB_NAME_LENGTH } from "../../constants/workspace/workspace";
import type { WorkspaceFileNameParts } from "./workspace.type";

/**
 * Splits a workspace file name into base name and extension.
 *
 * @remarks
 * Uses lastIndexOf to handle files with multiple dots correctly.
 * Returns empty extension for files without dots or starting with dot.
 */
export function splitWorkspaceFileName(
    fileName: string,
): WorkspaceFileNameParts {
    const extensionIndex = fileName.lastIndexOf(".");

    if (extensionIndex <= 0) {
        return {
            baseName: fileName,
            extension: "",
        };
    }

    return {
        baseName: fileName.slice(0, extensionIndex),
        extension: fileName.slice(extensionIndex),
    };
}

/**
 * Combines a base name and extension into a full workspace file name.
 */
export function buildWorkspaceFileName(
    baseName: string,
    extension: string,
): string {
    return `${baseName}${extension}`;
}

/**
 * Truncates a tab base name to the maximum allowed length.
 */
export function clampWorkspaceTabBaseName(baseName: string): string {
    return baseName.slice(0, MAX_WORKSPACE_TAB_NAME_LENGTH);
}

/**
 * Returns whether the tab base name exceeds the maximum allowed length.
 */
export function isWorkspaceTabBaseNameTooLong(baseName: string): boolean {
    return baseName.length > MAX_WORKSPACE_TAB_NAME_LENGTH;
}
