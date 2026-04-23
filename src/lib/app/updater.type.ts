export type AppUpdaterStatus =
    | "idle"
    | "checking"
    | "available"
    | "upToDate"
    | "downloading"
    | "installing"
    | "readyToRestart"
    | "error"
    | "unsupported";

export type AppUpdateMetadata = {
    currentVersion: string;
    version: string;
    date: string | null;
    body: string | null;
    rawJson: Record<string, unknown>;
};

export type AppUpdateDownloadProgress = {
    phase: "started" | "progress" | "finished";
    downloadedBytes: number;
    contentLength: number | null;
    progressPercent: number | null;
};
