import type { ReactNode } from "react";
import type { UseWorkspaceSessionResult } from "../../hooks/workspace/useWorkspaceSession.type";

export type AppHotkeysProviderProps = {
    workspaceSession: UseWorkspaceSessionResult;
    children: ReactNode;
};
