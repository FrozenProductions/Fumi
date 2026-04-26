import type { ReactNode } from "react";
import type { UseWorkspaceExecutorResult } from "../../lib/workspace/executor/executor.type";

/**
 * Props for the AppHotkeysProvider component.
 */
export type AppHotkeysProviderProps = {
    children: ReactNode;
    workspaceExecutor: UseWorkspaceExecutorResult;
};
