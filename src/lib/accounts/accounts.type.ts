export type AccountStatus = "active" | "offline";

export type AccountSummary = {
    id: string;
    userId: number;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    status: AccountStatus;
    lastLaunchedAt: number | null;
};

export type AccountListResponse = {
    accounts: readonly AccountSummary[];
    isRobloxRunning: boolean;
};

export type RobloxProcessInfo = {
    pid: number;
    startedAt: number;
};
