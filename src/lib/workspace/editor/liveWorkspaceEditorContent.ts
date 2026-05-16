const liveWorkspaceEditorContentByTabId = new Map<string, string>();

/**
 * Stores the live editor content for a specific tab.
 *
 * @param tabId - The tab identifier
 * @param content - The editor content to store
 */
export function setLiveWorkspaceEditorContent(
    tabId: string,
    content: string,
): void {
    liveWorkspaceEditorContentByTabId.set(tabId, content);
}

/**
 * Retrieves the live editor content for a specific tab.
 *
 * @param tabId - The tab identifier
 * @returns The stored content, or null if not found
 */
export function getLiveWorkspaceEditorContent(tabId: string): string | null {
    return liveWorkspaceEditorContentByTabId.get(tabId) ?? null;
}

/**
 * Clears the live editor content for a specific tab.
 *
 * @param tabId - The tab identifier to clear
 */
export function clearLiveWorkspaceEditorContent(tabId: string): void {
    liveWorkspaceEditorContentByTabId.delete(tabId);
}
