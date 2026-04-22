import type { UseAppUpdaterResult } from "../../../hooks/app/updater/useAppUpdater.type";

export type AppSettingsScreenProps = {
    updater: UseAppUpdaterResult;
};

export type AppSettingsGeneralSectionProps = {
    updater: UseAppUpdaterResult;
};

export type AppSettingsWorkspaceSectionProps = Record<string, never>;
