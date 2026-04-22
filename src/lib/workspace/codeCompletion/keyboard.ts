export function isManualCompletionShortcut(event: KeyboardEvent): boolean {
    return (event.metaKey || event.ctrlKey) && event.code === "Space";
}

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

export function isDeletionKey(key: string): boolean {
    return key === "Backspace" || key === "Delete";
}
