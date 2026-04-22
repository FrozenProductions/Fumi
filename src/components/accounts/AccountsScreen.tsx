import { Add01Icon } from "@hugeicons/core-free-icons";
import type { ReactElement } from "react";
import { AccountsAddModal } from "../../components/accounts/AccountsAddModal";
import { AccountsEmptyState } from "../../components/accounts/AccountsEmptyState";
import { AccountsErrorBanner } from "../../components/accounts/AccountsErrorBanner";
import { AccountsList } from "../../components/accounts/AccountsList";
import { useAccountReveal } from "../../hooks/accounts/useAccountReveal";
import { useAccounts } from "../../hooks/accounts/useAccounts";
import { useAppStore } from "../../hooks/app/useAppStore";
import type { AccountSummary } from "../../lib/accounts/accounts.type";
import { confirmAction } from "../../lib/platform/dialog";
import { AppIcon } from "../app/AppIcon";

/**
 * The accounts screen for managing saved Roblox accounts.
 *
 * @returns A React component
 */
export function AccountsScreen(): ReactElement {
    const isStreamerModeEnabled = useAppStore(
        (state) => state.isStreamerModeEnabled,
    );
    const {
        accounts,
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
        launchAccount,
        deleteAccount,
        clearErrorMessage,
    } = useAccounts();
    const {
        revealedAccountId,
        revealAccount,
        hideAccount,
        handleAccountRowBlur,
    } = useAccountReveal();

    async function handleDeleteAccount(account: AccountSummary): Promise<void> {
        const shouldDelete = await confirmAction(
            `Delete ${account.displayName} from Fumi? Any live Roblox window for this account will stay open and be shown as an unknown account.`,
        );

        if (!shouldDelete) {
            return;
        }

        await deleteAccount(account.id);
    }

    return (
        <section className="relative flex h-full min-h-0 flex-col bg-fumi-50">
            <div
                className={`flex min-h-0 flex-1 flex-col overflow-y-auto bg-fumi-50/30 p-4 [&::-webkit-scrollbar-thumb:hover]:bg-[rgb(var(--color-scrollbar-thumb-hover)/1)] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-[rgb(var(--color-scrollbar-thumb)/1)] [&::-webkit-scrollbar-thumb]:bg-clip-padding [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:h-[6px] [&::-webkit-scrollbar]:w-[6px] ${
                    accounts.length > 0 ? "pb-24" : "pb-4"
                }`}
            >
                <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4">
                    {errorMessage ? (
                        <AccountsErrorBanner
                            errorMessage={errorMessage}
                            onDismiss={clearErrorMessage}
                        />
                    ) : null}

                    {accounts.length === 0 ? (
                        <AccountsEmptyState onOpenAddModal={openAddModal} />
                    ) : (
                        <AccountsList
                            accounts={accounts}
                            deletingAccountId={deletingAccountId}
                            isStreamerModeEnabled={isStreamerModeEnabled}
                            launchingAccountId={launchingAccountId}
                            revealedAccountId={revealedAccountId}
                            onDeleteAccount={handleDeleteAccount}
                            onHideAccount={hideAccount}
                            onLaunchAccount={launchAccount}
                            onRevealAccount={revealAccount}
                            onRowBlur={handleAccountRowBlur}
                        />
                    )}
                </div>
            </div>

            {accounts.length > 0 ? (
                <div className="pointer-events-none absolute bottom-5 right-5 z-10">
                    <button
                        type="button"
                        onClick={openAddModal}
                        className="app-select-none pointer-events-auto flex h-10 items-center gap-2 rounded-[0.85rem] bg-fumi-600 px-4 text-xs font-semibold text-fumi-50 shadow-[var(--shadow-app-card)] transition-colors hover:bg-fumi-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-2 focus-visible:ring-offset-fumi-50"
                    >
                        <AppIcon
                            icon={Add01Icon}
                            className="size-[1.1rem]"
                            strokeWidth={2}
                        />
                        Add Account
                    </button>
                </div>
            ) : null}

            <AccountsAddModal
                closeAddModal={closeAddModal}
                draftCookie={draftCookie}
                isOpen={isAddModalOpen}
                isSubmittingAdd={isSubmittingAdd}
                setDraftCookie={setDraftCookie}
                submitAddAccount={submitAddAccount}
            />
        </section>
    );
}
