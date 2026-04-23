import {
    MASKED_ACCOUNT_AVATAR_ALT,
    MASKED_ACCOUNT_IDENTITY_LABEL,
    MASKED_ACCOUNT_LABEL,
} from "../../constants/accounts/accounts";
import type { AccountSummary, RobloxProcessInfo } from "./accounts.type";

type AccountPrivacyOptions = {
    isMasked?: boolean;
};

type BoundAccountLabelSource = {
    boundAccountDisplayName: string | null;
    isBoundToUnknownAccount: boolean;
};

type AccountIdentitySource = Pick<AccountSummary, "displayName" | "username">;

function getMaskableAccountLabel(
    displayName: string | null,
    options?: AccountPrivacyOptions,
): string | null {
    if (!displayName) {
        return null;
    }

    return options?.isMasked ? MASKED_ACCOUNT_LABEL : displayName;
}

/**
 * Returns a display label for an executor-bound account, masking the name when requested.
 */
export function getExecutorBoundAccountLabel(
    summary: BoundAccountLabelSource,
    options?: AccountPrivacyOptions,
): string {
    const boundAccountLabel = getMaskableAccountLabel(
        summary.boundAccountDisplayName,
        options,
    );

    if (boundAccountLabel !== null) {
        return boundAccountLabel;
    }

    if (summary.isBoundToUnknownAccount) {
        return "Unknown account";
    }

    return "Available";
}

/**
 * Returns a display label for a Roblox process-bound account, masking the name when requested.
 */
export function getRobloxProcessBoundAccountLabel(
    process: Pick<
        RobloxProcessInfo,
        "boundAccountDisplayName" | "isBoundToUnknownAccount"
    >,
    options?: AccountPrivacyOptions,
): string {
    const boundAccountLabel = getMaskableAccountLabel(
        process.boundAccountDisplayName,
        options,
    );

    if (boundAccountLabel !== null) {
        return boundAccountLabel;
    }

    if (process.isBoundToUnknownAccount) {
        return "Unknown account";
    }

    return "Unknown account";
}

/**
 * Returns the account display name, or a masked placeholder when privacy mode is enabled.
 */
export function getAccountRowDisplayName(
    account: AccountIdentitySource,
    options?: AccountPrivacyOptions,
): string {
    return options?.isMasked ? MASKED_ACCOUNT_LABEL : account.displayName;
}

/**
 * Returns the account identity label (e.g. @username), or a masked placeholder when privacy mode is enabled.
 */
export function getAccountRowIdentityLabel(
    account: AccountIdentitySource,
    options?: AccountPrivacyOptions,
): string {
    return options?.isMasked
        ? MASKED_ACCOUNT_IDENTITY_LABEL
        : `@${account.username}`;
}

/**
 * Returns alt text for an account avatar image, masking when privacy mode is enabled.
 */
export function getAccountAvatarAltText(
    account: Pick<AccountSummary, "displayName">,
    options?: AccountPrivacyOptions,
): string {
    return options?.isMasked
        ? MASKED_ACCOUNT_AVATAR_ALT
        : `${account.displayName} avatar`;
}
