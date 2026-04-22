import { getRobloxProcessBoundAccountLabel } from "../../../lib/accounts/accountPrivacy";
import type {
    RobloxAccountIdentity,
    RobloxProcessInfo,
} from "../../../lib/accounts/accounts.type";

/**
 * Returns a display label for a Roblox process based on its account binding.
 *
 * @param process - The process info with account details
 * @returns A human-readable label
 */
export function getRobloxProcessAccountLabel(
    process: Pick<
        RobloxProcessInfo,
        "boundAccountDisplayName" | "isBoundToUnknownAccount"
    >,
    options?: {
        isMasked?: boolean;
    },
): string {
    return getRobloxProcessBoundAccountLabel(process, options);
}

/**
 * Returns a tooltip label for a live Roblox account.
 *
 * @param liveRobloxAccount - The live account identity or null
 * @returns Formatted label or null
 */
export function getLiveRobloxAccountTooltipLabel(
    liveRobloxAccount: RobloxAccountIdentity | null,
): string | null {
    if (liveRobloxAccount === null) {
        return null;
    }

    return `${liveRobloxAccount.displayName} (@${liveRobloxAccount.username})`;
}
