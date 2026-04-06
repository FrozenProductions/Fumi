import type {
    AppUpdateDownloadProgress,
    AppUpdateMetadata,
    AppUpdaterStatus,
} from "../../lib/app/app.type";

export type UseAppUpdaterResult = {
    status: AppUpdaterStatus;
    availableUpdate: AppUpdateMetadata | null;
    downloadProgress: AppUpdateDownloadProgress | null;
    errorMessage: string | null;
    checkForUpdates: () => Promise<void>;
    downloadAndInstallUpdate: () => Promise<void>;
    relaunchToApplyUpdate: () => Promise<void>;
};

export type CheckForUpdatesOptions = {
    isSilent?: boolean;
    shouldRetryOnFailure?: boolean;
    shouldAutoUpdate?: boolean;
};
