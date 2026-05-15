import type { UseAppUpdaterResult } from "../../../hooks/app/useAppUpdater.type";
import type {
    AppUpdateDownloadProgress,
    AppUpdaterStatus,
} from "../../../lib/app/updater.type";

export type AppSettingsScreenProps = {
    updater: UseAppUpdaterResult;
};

export type AppSettingsGeneralSectionProps = {
    updater: UseAppUpdaterResult;
};

export type AppInfoUpdateCardProps = {
    checkForUpdatesButtonClassName: string;
    checkForUpdatesButtonLabel: string;
    displayedDownloadProgress: AppUpdateDownloadProgress | null;
    displayedUpdaterStatus: AppUpdaterStatus;
    errorMessage: string | null;
    progressSummary: string | null;
    restartButtonClassName: string;
    shouldDisableCheckButton: boolean;
    updaterPhrase: string;
    onCheckForUpdates: () => void;
    onOpenAuthorUrl: () => void;
    onRelaunchToApplyUpdate: () => void;
};

export type AppZoomSettingProps = {
    zoomPercent: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onZoomPercentChange: (value: string) => void;
};
