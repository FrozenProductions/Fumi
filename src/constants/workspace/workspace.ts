import { PointerActivationConstraints } from "@dnd-kit/dom";
import { PointerSensor } from "@dnd-kit/react";

export const MAX_WORKSPACE_TAB_NAME_LENGTH = 20;
export const WORKSPACE_MENU_RADIUS_REM = 0.875;
export const WORKSPACE_MENU_INSET_REM = 0.375;
export const WORKSPACE_TAB_LIST_ITEM_HEIGHT_REM = 2;
export const WORKSPACE_TAB_LIST_HORIZONTAL_PADDING_REM =
    WORKSPACE_MENU_INSET_REM;
export const WORKSPACE_TAB_LIST_TOP_PADDING_REM = WORKSPACE_MENU_INSET_REM;
export const WORKSPACE_TAB_LIST_BOTTOM_PADDING_REM = WORKSPACE_MENU_INSET_REM;
export const WORKSPACE_TAB_LIST_VISIBLE_COUNT = 5;
export const WORKSPACE_REFRESH_INTERVAL_MS = 2000;
export const DEFAULT_WORKSPACE_SPLIT_RATIO = 0.5;
export const MIN_WORKSPACE_SPLIT_RATIO = 0.12;
export const MAX_WORKSPACE_SPLIT_RATIO = 0.88;
export const WORKSPACE_SPLIT_CLOSE_THRESHOLD = 0.08;
export const WORKSPACE_UNAVAILABLE_ERROR_MESSAGE =
    "Workspace folder is unavailable. Unsaved changes are kept in memory until it becomes available again or you choose another workspace.";
export const RECENT_WORKSPACE_STORAGE_KEY = "fumi-recent-workspaces";
export const MAX_RECENT_WORKSPACES = 6;
export const EXECUTOR_PORTS_STORAGE_KEY = "fumi-executor-ports";
export const STRUCTURAL_TEXT_PATTERN =
    /\b(local|function|export|for|while|repeat|until|if|elseif|else|do|end)\b|[={}()[\]]/u;
export const TAB_BAR_MODIFIERS: never[] = [];
export const TAB_BAR_SORTABLE_GROUP = "workspace-tabs";
export const SPLIT_DROP_LEFT_ID = "workspace-split-left";
export const SPLIT_DROP_RIGHT_ID = "workspace-split-right";
export const SPLIT_DROP_IDS = new Set([
    "workspace-split-left",
    "workspace-split-right",
]);
export const WORKSPACE_TAB_LIST_DROPDOWN_STYLE = {
    "--workspace-menu-radius": `${WORKSPACE_MENU_RADIUS_REM}rem`,
    "--workspace-menu-inset": `${WORKSPACE_MENU_INSET_REM}rem`,
    "--workspace-menu-item-radius":
        "calc(var(--workspace-menu-radius) - var(--workspace-menu-inset))",
    paddingBottom: `${WORKSPACE_TAB_LIST_BOTTOM_PADDING_REM}rem`,
    paddingInline: `${WORKSPACE_TAB_LIST_HORIZONTAL_PADDING_REM}rem`,
    paddingTop: `${WORKSPACE_TAB_LIST_TOP_PADDING_REM}rem`,
};
export const WORKSPACE_TAB_LIST_DROPDOWN_VIEWPORT_STYLE = {
    maxHeight: `calc(${WORKSPACE_TAB_LIST_VISIBLE_COUNT} * ${WORKSPACE_TAB_LIST_ITEM_HEIGHT_REM}rem)`,
};
export const WORKSPACE_TAB_CONTEXT_MENU_EXIT_DURATION_MS = 120;
export const WORKSPACE_TAB_DUPLICATE_SUFFIX = " copy";
export const WORKSPACE_TAB_DUPLICATE_PATTERN = / copy(?:-(\d+))?$/;
export const WORKSPACE_PERSIST_DELAY_MS = 200;
export const EXECUTOR_STATUS_POLL_INTERVAL_MS = 2_000;
export const STARTUP_UPDATE_CHECK_RETRY_DELAY_MS = 5_000;
export const TAB_BAR_SENSORS = [
    PointerSensor.configure({
        activationConstraints: [
            new PointerActivationConstraints.Distance({
                value: 6,
            }),
        ],
    }),
];
export const INITIAL_WORKSPACE_UI_STATE = {
    isTabListOpen: false,
    renamingTabId: null,
    renameValue: "",
    isRenameSubmitting: false,
    hasRenameError: false,
};
