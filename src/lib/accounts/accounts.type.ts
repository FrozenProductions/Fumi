export type AccountStatus = "active" | "offline";

export type AccountSummary = {
    id: string;
    userId: number;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    status: AccountStatus;
    boundPort: number | null;
    lastLaunchedAt: number | null;
};

export type AccountListResponse = {
    accounts: readonly AccountSummary[];
    isRobloxRunning: boolean;
};

export type RobloxProcessInfo = {
    pid: number;
    startedAt: number;
    boundAccountId: string | null;
    boundAccountDisplayName: string | null;
    isBoundToUnknownAccount: boolean;
};

export type RobloxAccountIdentity = {
    userId: number;
    username: string;
    displayName: string;
    avatarUrl: string | null;
};
