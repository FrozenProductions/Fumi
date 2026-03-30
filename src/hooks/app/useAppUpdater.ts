import { useCallback, useEffect, useRef, useState } from "react";
import { confirmAction } from "../../lib/platform/dialog";
import { isTauriEnvironment } from "../../lib/platform/runtime";
import {
    checkForAppUpdate,
    downloadAndInstallAppUpdate,
    relaunchApp,
} from "../../lib/platform/updater";
import { subscribeToCheckForUpdatesRequested } from "../../lib/platform/window";
import { getErrorMessage } from "../../lib/shared/errorMessage";
import type {
    AppUpdateDownloadProgress,
    AppUpdateMetadata,
    AppUpdaterStatus,
} from "../../types/app/updater";

export type UseAppUpdaterResult = {
    status: AppUpdaterStatus;
    availableUpdate: AppUpdateMetadata | null;
    downloadProgress: AppUpdateDownloadProgress | null;
    errorMessage: string | null;
    checkForUpdates: () => Promise<void>;
    downloadAndInstallUpdate: () => Promise<void>;
    relaunchToApplyUpdate: () => Promise<void>;
};

type CheckForUpdatesOptions = {
    isSilent?: boolean;
};

export function useAppUpdater(): UseAppUpdaterResult {
    const [status, setStatus] = useState<AppUpdaterStatus>(() =>
        isTauriEnvironment() ? "idle" : "unsupported",
    );
    const [availableUpdate, setAvailableUpdate] =
        useState<AppUpdateMetadata | null>(null);
    const [downloadProgress, setDownloadProgress] =
        useState<AppUpdateDownloadProgress | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const hasCompletedStartupCheckRef = useRef(false);

    const runUpdateCheck = useCallback(
        async (options?: CheckForUpdatesOptions): Promise<void> => {
            if (!isTauriEnvironment()) {
                setStatus("unsupported");
                return;
            }

            setStatus("checking");
            setErrorMessage(null);
            setDownloadProgress(null);

            try {
                const nextUpdate = await checkForAppUpdate();

                if (!nextUpdate) {
                    setAvailableUpdate(null);
                    setStatus("upToDate");
                    return;
                }

                setAvailableUpdate(nextUpdate);
                setStatus("available");
            } catch (error) {
                const nextErrorMessage = getErrorMessage(
                    error,
                    "Unable to check for updates right now.",
                );

                if (options?.isSilent) {
                    setStatus("idle");
                    return;
                }

                setStatus("error");
                setErrorMessage(nextErrorMessage);
            }
        },
        [],
    );

    const handleDownloadAndInstallUpdate =
        useCallback(async (): Promise<void> => {
            if (!availableUpdate || !isTauriEnvironment()) {
                return;
            }

            const shouldInstall = await confirmAction(
                `Download and install Fumi v${availableUpdate.version} now?`,
            );

            if (!shouldInstall) {
                return;
            }

            setStatus("downloading");
            setErrorMessage(null);
            setDownloadProgress(null);

            try {
                await downloadAndInstallAppUpdate(
                    availableUpdate,
                    (nextProgress) => {
                        setDownloadProgress(nextProgress);
                        setStatus(
                            nextProgress.phase === "finished"
                                ? "installing"
                                : "downloading",
                        );
                    },
                );

                setDownloadProgress(null);
                setStatus("readyToRestart");
            } catch (error) {
                setStatus("error");
                setErrorMessage(
                    getErrorMessage(
                        error,
                        `Unable to install Fumi v${availableUpdate.version}.`,
                    ),
                );
            }
        }, [availableUpdate]);

    const handleRelaunchToApplyUpdate = useCallback(async (): Promise<void> => {
        if (!availableUpdate || !isTauriEnvironment()) {
            return;
        }

        const shouldRelaunch = await confirmAction(
            `Restart Fumi now to finish applying v${availableUpdate.version}?`,
        );

        if (!shouldRelaunch) {
            return;
        }

        await relaunchApp();
    }, [availableUpdate]);

    useEffect(() => {
        if (!isTauriEnvironment() || hasCompletedStartupCheckRef.current) {
            return;
        }

        hasCompletedStartupCheckRef.current = true;
        void runUpdateCheck({ isSilent: true });
    }, [runUpdateCheck]);

    useEffect(() => {
        return subscribeToCheckForUpdatesRequested(() => {
            void runUpdateCheck();
        });
    }, [runUpdateCheck]);

    return {
        status,
        availableUpdate,
        downloadProgress,
        errorMessage,
        checkForUpdates: useCallback(
            async () => runUpdateCheck(),
            [runUpdateCheck],
        ),
        downloadAndInstallUpdate: handleDownloadAndInstallUpdate,
        relaunchToApplyUpdate: handleRelaunchToApplyUpdate,
    };
}
