export const WORKSPACE_EDITOR_FONT_FAMILY =
    '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace';

export const WORKSPACE_EDITOR_OPTIONS = {
    fontFamily: WORKSPACE_EDITOR_FONT_FAMILY,
    useWorker: false,
    displayIndentGuides: true,
    showFoldWidgets: false,
    scrollPastEnd: true,
} as const;

export const WORKSPACE_EDITOR_PROPS = {
    $blockScrolling: true,
} as const;

export const WORKSPACE_EDITOR_STYLE = {
    fontFamily: WORKSPACE_EDITOR_FONT_FAMILY,
} as const;

export const WORKSPACE_EDITOR_SEARCH_PANEL_EXIT_DURATION_MS = 150;
