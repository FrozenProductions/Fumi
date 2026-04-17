import type {
    RobloxAccountIdentity,
    RobloxProcessInfo,
} from "../../lib/accounts/accounts.type";

export function getRobloxProcessAccountLabel(
    process: Pick<
        RobloxProcessInfo,
        "boundAccountDisplayName" | "isBoundToUnknownAccount"
    >,
): string {
    if (process.boundAccountDisplayName) {
        return process.boundAccountDisplayName;
    }

    if (process.isBoundToUnknownAccount) {
        return "? Unknown account";
    }

    return "Unknown account";
}

export function getLiveRobloxAccountTooltipLabel(
    liveRobloxAccount: RobloxAccountIdentity | null,
): string | null {
    if (liveRobloxAccount === null) {
        return null;
    }

    return `${liveRobloxAccount.displayName} (@${liveRobloxAccount.username})`;
}
