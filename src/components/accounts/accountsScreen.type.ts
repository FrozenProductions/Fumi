import type { FocusEvent } from "react";
import type { UseAccountsResult } from "../../hooks/accounts/useAccounts.type";
import type { AccountSummary } from "../../lib/accounts/accounts.type";

export type AccountsErrorBannerProps = {
    errorMessage: string;
    onDismiss: () => void;
};

export type AccountsEmptyStateProps = {
    onOpenAddModal: () => void;
};

export type AccountsAddModalProps = Pick<
    UseAccountsResult,
    | "closeAddModal"
    | "draftCookie"
    | "isSubmittingAdd"
    | "setDraftCookie"
    | "submitAddAccount"
> & {
    isOpen: boolean;
};

export type AccountsListProps = {
    accounts: AccountSummary[];
    deletingAccountId: string | null;
    isStreamerModeEnabled: boolean;
    launchingAccountId: string | null;
    revealedAccountId: string | null;
    onDeleteAccount: (account: AccountSummary) => Promise<void>;
    onHideAccount: (
        accountId: string,
        currentTarget: HTMLDivElement,
        relatedTarget?: EventTarget | null,
    ) => void;
    onLaunchAccount: (accountId: string) => Promise<void>;
    onRevealAccount: (accountId: string) => void;
    onRowBlur: (event: FocusEvent<HTMLDivElement>, accountId: string) => void;
};
