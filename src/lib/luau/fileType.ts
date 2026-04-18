function getFileExtension(fileName: string): string {
    const lastDotIndex = fileName.lastIndexOf(".");

    if (lastDotIndex < 0) {
        return "";
    }

    return fileName.slice(lastDotIndex).toLowerCase();
}

/**
 * Determines if a file name has a Luau extension (.lua or .luau).
 *
 * @remarks
 * Case-insensitive comparison. Empty extensions return false.
 */
export function isLuauFileName(fileName: string): boolean {
    const extension = getFileExtension(fileName);

    return extension === ".lua" || extension === ".luau";
}

export function getEditorModeForFileName(fileName: string): "luau" | "text" {
    return isLuauFileName(fileName) ? "luau" : "text";
}
