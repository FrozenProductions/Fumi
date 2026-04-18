import { WORKSPACE_EDITOR_OPTIONS } from "./editor";

export const EXECUTION_HISTORY_LARGE_SCRIPT_MAX_CHARACTERS = 200_000;

export const EXECUTION_HISTORY_LARGE_SCRIPT_MAX_LINES = 4_000;

export const EXECUTION_HISTORY_EDITOR_OPTIONS = {
    ...WORKSPACE_EDITOR_OPTIONS,
    scrollPastEnd: false,
} as const;

export const EXECUTION_HISTORY_LARGE_SCRIPT_EDITOR_OPTIONS = {
    ...EXECUTION_HISTORY_EDITOR_OPTIONS,
    animatedScroll: false,
    behavioursEnabled: false,
    displayIndentGuides: false,
    enableMultiselect: false,
    fadeFoldWidgets: false,
    fixedWidthGutter: true,
    highlightGutterLine: false,
    highlightSelectedWord: false,
    indentedSoftWrap: false,
    showFoldWidgets: false,
} as const;
