/**
 * Returns whether the keyboard event is the explicit completion shortcut (Ctrl/Cmd+Space).
 */
export function isManualCompletionShortcut(event: KeyboardEvent): boolean {
    return (event.metaKey || event.ctrlKey) && event.code === "Space";
}

/**
 * Returns whether the key is a navigation key (arrows, home, end, page up/down).
 */
export function isNavigationKey(key: string): boolean {
    return (
        key === "ArrowLeft" ||
        key === "ArrowRight" ||
        key === "ArrowUp" ||
        key === "ArrowDown" ||
        key === "Home" ||
        key === "End" ||
        key === "PageUp" ||
        key === "PageDown"
    );
}

/**
 * Returns whether the key is a deletion key (Backspace or Delete).
 */
export function isDeletionKey(key: string): boolean {
    return key === "Backspace" || key === "Delete";
}
