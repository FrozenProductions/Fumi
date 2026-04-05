import type { UseAppUpdaterResult } from "../../../hooks/app/useAppUpdater";
import type { UseWorkspaceSessionResult } from "../../../hooks/workspace/useWorkspaceSession.type";

export type AppSettingsScreenProps = {
    updater: UseAppUpdaterResult;
    workspaceSession: UseWorkspaceSessionResult;
};

export type AppSettingsGeneralSectionProps = {
    updater: UseAppUpdaterResult;
};

export type AppSettingsWorkspaceSectionProps = {
    workspaceSession: UseWorkspaceSessionResult;
};
