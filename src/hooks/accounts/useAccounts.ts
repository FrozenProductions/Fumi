import { useCallback, useEffect, useRef, useState } from "react";
import {
    removeAccountSummary,
    sortAccounts,
    upsertAccountSummary,
} from "../../lib/accounts/accounts";
import {
    addAccount,
    deleteAccount,
    launchAccount,
    listAccounts,
} from "../../lib/platform/accounts";
import { getErrorMessage } from "../../lib/shared/errorMessage";
import type { UseAccountsResult } from "./useAccounts.type";

/**
 * Manages Roblox account lifecycle including listing, adding, launching, and deleting accounts.
 *
 * @remarks
 * Hydrates accounts on mount and refreshes on focus/visibility changes while
 * coordinating with the platform layer to persist and launch Roblox sessions.
 */
export function useAccounts(): UseAccountsResult {
    const [accounts, setAccounts] = useState(
        () => [] as ReturnType<typeof sortAccounts>,
    );
    const [isRobloxRunning, setIsRobloxRunning] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [draftCookie, setDraftCookie] = useState("");
    const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
    const [launchingAccountId, setLaunchingAccountId] = useState<string | null>(
        null,
    );
    const [deletingAccountId, setDeletingAccountId] = useState<string | null>(
        null,
    );
    const isMountedRef = useRef(true);
    const refreshTimeoutRef = useRef<number | null>(null);
    const lastRefreshAtRef = useRef(0);

    const loadAccounts = useCallback(
        async (options?: { suppressError?: boolean }): Promise<void> => {
            try {
                const response = await listAccounts();

                if (!isMountedRef.current) {
                    return;
                }

                setAccounts(sortAccounts(response.accounts));
                setIsRobloxRunning(response.isRobloxRunning);
                setErrorMessage(null);
            } catch (error) {
                if (!isMountedRef.current || options?.suppressError) {
                    return;
                }

                setErrorMessage(
                    getErrorMessage(error, "Could not load saved accounts."),
                );
            }
        },
        [],
    );

    useEffect(() => {
        void loadAccounts();

        const scheduleAccountsRefresh = (): void => {
            if (refreshTimeoutRef.current !== null) {
                window.clearTimeout(refreshTimeoutRef.current);
            }

            refreshTimeoutRef.current = window.setTimeout(() => {
                refreshTimeoutRef.current = null;

                const now = Date.now();

                if (now - lastRefreshAtRef.current < 250) {
                    return;
                }

                lastRefreshAtRef.current = now;
                void loadAccounts({ suppressError: true });
            }, 100);
        };

        const handleWindowFocus = (): void => {
            scheduleAccountsRefresh();
        };

        const handleVisibilityChange = (): void => {
            if (document.visibilityState === "visible") {
                scheduleAccountsRefresh();
            }
        };

        window.addEventListener("focus", handleWindowFocus);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            isMountedRef.current = false;

            if (refreshTimeoutRef.current !== null) {
                window.clearTimeout(refreshTimeoutRef.current);
                refreshTimeoutRef.current = null;
            }

            window.removeEventListener("focus", handleWindowFocus);
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange,
            );
        };
    }, [loadAccounts]);

    const openAddModal = (): void => {
        setIsAddModalOpen(true);
        setErrorMessage(null);
    };

    const closeAddModal = (): void => {
        if (isSubmittingAdd) {
            return;
        }

        setIsAddModalOpen(false);
        setDraftCookie("");
    };

    const clearErrorMessage = (): void => {
        setErrorMessage(null);
    };

    const submitAddAccount = async (): Promise<void> => {
        if (isSubmittingAdd) {
            return;
        }

        setIsSubmittingAdd(true);
        setErrorMessage(null);

        try {
            const account = await addAccount(draftCookie);
            setAccounts((currentAccounts) =>
                upsertAccountSummary(currentAccounts, account),
            );
            setIsAddModalOpen(false);
            setDraftCookie("");
        } catch (error) {
            setErrorMessage(
                getErrorMessage(error, "Could not save the Roblox account."),
            );
        } finally {
            setIsSubmittingAdd(false);
        }
    };

    const launchSelectedAccount = async (accountId: string): Promise<void> => {
        if (launchingAccountId !== null || deletingAccountId !== null) {
            return;
        }

        setLaunchingAccountId(accountId);
        setErrorMessage(null);

        try {
            const account = await launchAccount(accountId);
            setAccounts((currentAccounts) =>
                upsertAccountSummary(currentAccounts, account),
            );
            setIsRobloxRunning(true);
        } catch (error) {
            setErrorMessage(
                getErrorMessage(error, "Could not launch the Roblox account."),
            );
        } finally {
            setLaunchingAccountId(null);
        }
    };

    const deleteSelectedAccount = async (accountId: string): Promise<void> => {
        if (deletingAccountId !== null || launchingAccountId !== null) {
            return;
        }

        setDeletingAccountId(accountId);
        setErrorMessage(null);

        try {
            await deleteAccount(accountId);
            setAccounts((currentAccounts) =>
                removeAccountSummary(currentAccounts, accountId),
            );
        } catch (error) {
            setErrorMessage(
                getErrorMessage(error, "Could not delete the Roblox account."),
            );
        } finally {
            setDeletingAccountId(null);
        }
    };

    return {
        accounts,
        isRobloxRunning,
        errorMessage,
        isAddModalOpen,
        draftCookie,
        isSubmittingAdd,
        launchingAccountId,
        deletingAccountId,
        openAddModal,
        closeAddModal,
        setDraftCookie,
        submitAddAccount,
        launchAccount: launchSelectedAccount,
        deleteAccount: deleteSelectedAccount,
        clearErrorMessage,
    };
}
