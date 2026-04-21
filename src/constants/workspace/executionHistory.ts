import { WORKSPACE_EDITOR_OPTIONS } from "./editor";

export const EXECUTION_HISTORY_EDITOR_OPTIONS = {
    ...WORKSPACE_EDITOR_OPTIONS,
    scrollPastEnd: false,
} as const;
