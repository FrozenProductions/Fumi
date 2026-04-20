import type { WorkspaceOutlineSearchFieldName } from "../../lib/workspace/outlineSearch.type";

export const WORKSPACE_OUTLINE_CACHE_MAX_ENTRIES = 6;
export const WORKSPACE_OUTLINE_SCAN_IDLE_TIMEOUT_MS = 200;
export const WORKSPACE_OUTLINE_SCAN_STANDARD_DEBOUNCE_MS = 80;
export const WORKSPACE_OUTLINE_SCAN_LARGE_FILE_DEBOUNCE_MS = 250;
export const WORKSPACE_OUTLINE_LARGE_FILE_THRESHOLD = 50_000;
export const WORKSPACE_OUTLINE_PANEL_DEFAULT_WIDTH = 256;
export const WORKSPACE_OUTLINE_PANEL_MIN_WIDTH = 200;
export const WORKSPACE_OUTLINE_PANEL_MAX_WIDTH = 480;
export const WORKSPACE_OUTLINE_VIRTUAL_GROUP_HEIGHT = 30;
export const WORKSPACE_OUTLINE_VIRTUAL_ITEM_HEIGHT = 26;
export const WORKSPACE_OUTLINE_VIRTUAL_PADDING = 8;
export const WORKSPACE_OUTLINE_VIRTUAL_OVERSCAN = 10;
export const WORKSPACE_OUTLINE_SEARCH_FIELD_WEIGHTS = {
    label: 80,
    detail: 60,
    group: 40,
    kind: 20,
} as const satisfies Record<WorkspaceOutlineSearchFieldName, number>;
