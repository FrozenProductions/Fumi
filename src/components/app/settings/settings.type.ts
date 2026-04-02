import type { UseAppUpdaterResult } from "../../../hooks/app/useAppUpdater";
import type { UseWorkspaceSessionResult } from "../../../lib/workspace/workspace.type";

export type AppSettingsGeneralSectionProps = {
    updater: UseAppUpdaterResult;
};

export type AppSettingsWorkspaceSectionProps = {
    workspaceSession: UseWorkspaceSessionResult;
};
