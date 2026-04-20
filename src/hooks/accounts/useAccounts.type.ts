import type { AccountSummary } from "../../lib/accounts/accounts.type";

export type UseAccountsResult = {
    accounts: AccountSummary[];
    isRobloxRunning: boolean;
    errorMessage: string | null;
    isAddModalOpen: boolean;
    draftCookie: string;
    isSubmittingAdd: boolean;
    launchingAccountId: string | null;
    deletingAccountId: string | null;
    openAddModal: () => void;
    closeAddModal: () => void;
    setDraftCookie: (cookie: string) => void;
    submitAddAccount: () => Promise<void>;
    launchAccount: (accountId: string) => Promise<void>;
    deleteAccount: (accountId: string) => Promise<void>;
    clearErrorMessage: () => void;
};
