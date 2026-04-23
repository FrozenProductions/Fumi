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

export function getAccountRowDisplayName(
    account: AccountIdentitySource,
    options?: AccountPrivacyOptions,
): string {
    return options?.isMasked ? MASKED_ACCOUNT_LABEL : account.displayName;
}

export function getAccountRowIdentityLabel(
    account: AccountIdentitySource,
    options?: AccountPrivacyOptions,
): string {
    return options?.isMasked
        ? MASKED_ACCOUNT_IDENTITY_LABEL
        : `@${account.username}`;
}

export function getAccountAvatarAltText(
    account: Pick<AccountSummary, "displayName">,
    options?: AccountPrivacyOptions,
): string {
    return options?.isMasked
        ? MASKED_ACCOUNT_AVATAR_ALT
        : `${account.displayName} avatar`;
}
