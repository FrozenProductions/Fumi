const liveWorkspaceEditorContentByTabId = new Map<string, string>();

export function setLiveWorkspaceEditorContent(
    tabId: string,
    content: string,
): void {
    liveWorkspaceEditorContentByTabId.set(tabId, content);
}

export function getLiveWorkspaceEditorContent(tabId: string): string | null {
    return liveWorkspaceEditorContentByTabId.get(tabId) ?? null;
}

export function clearLiveWorkspaceEditorContent(tabId: string): void {
    liveWorkspaceEditorContentByTabId.delete(tabId);
}
