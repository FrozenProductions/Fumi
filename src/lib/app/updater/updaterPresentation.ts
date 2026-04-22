import type { AppUpdateDownloadProgress } from "../app.type";

function formatAppUpdateByteCount(value: number | null): string | null {
    if (value === null || value <= 0) {
        return null;
    }

    if (value < 1024) {
        return `${value} B`;
    }

    const units = ["KB", "MB", "GB"];
    let currentValue = value / 1024;
    let unitIndex = 0;

    while (currentValue >= 1024 && unitIndex < units.length - 1) {
        currentValue /= 1024;
        unitIndex += 1;
    }

    return `${currentValue.toFixed(currentValue >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

export function getAppUpdateProgressSummary(
    progress: AppUpdateDownloadProgress | null,
): string | null {
    if (!progress) {
        return null;
    }

    const downloadedText = formatAppUpdateByteCount(progress.downloadedBytes);
    const totalText = formatAppUpdateByteCount(progress.contentLength);

    if (!downloadedText || !totalText) {
        return progress.progressPercent === null
            ? null
            : `${progress.progressPercent}% downloaded`;
    }

    return `${downloadedText} of ${totalText} downloaded`;
}
