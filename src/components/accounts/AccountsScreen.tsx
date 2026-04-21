import {
    Add01Icon,
    Delete02Icon,
    PlayIcon,
    UserCircleIcon,
} from "@hugeicons/core-free-icons";
import { type FocusEvent, type ReactElement, useState } from "react";
import emptyAddIcon from "../../assets/icons/empty_add.svg";
import { useAccounts } from "../../hooks/accounts/useAccounts";
import { useAppStore } from "../../hooks/app/useAppStore";
import {
    getAccountAvatarAltText,
    getAccountRowDisplayName,
    getAccountRowIdentityLabel,
} from "../../lib/accounts/accountPrivacy";
import type { AccountSummary } from "../../lib/accounts/accounts.type";
import { confirmAction } from "../../lib/platform/dialog";
import { AppIcon } from "../app/AppIcon";

function getAccountStatusTone(account: AccountSummary): string {
    return account.boundPort !== null
        ? "border-emerald-200 bg-emerald-50 text-emerald-600"
        : "border-fumi-200 bg-fumi-100 text-fumi-500";
}

function getAccountStatusLabel(account: AccountSummary): string {
    return account.boundPort !== null ? "Active" : "Offline";
}

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
    const [revealedAccountId, setRevealedAccountId] = useState<string | null>(
        null,
    );

    function handleRevealAccount(accountId: string): void {
        setRevealedAccountId(accountId);
    }

    function handleHideAccount(
        accountId: string,
        currentTarget: HTMLDivElement,
        relatedTarget: EventTarget | null = null,
    ): void {
        if (
            relatedTarget instanceof Node &&
            currentTarget.contains(relatedTarget)
        ) {
            return;
        }

        if (currentTarget.contains(document.activeElement)) {
            return;
        }

        if (currentTarget.matches(":hover")) {
            return;
        }

        setRevealedAccountId((currentAccountId) =>
            currentAccountId === accountId ? null : currentAccountId,
        );
    }

    function handleAccountRowBlur(
        event: FocusEvent<HTMLDivElement>,
        accountId: string,
    ): void {
        handleHideAccount(accountId, event.currentTarget, event.relatedTarget);
    }

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
                        <div className="rounded-[1rem] border border-red-200 bg-red-50 px-4 py-3 shadow-[var(--shadow-app-card)]">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-red-500">
                                        Accounts Error
                                    </p>
                                    <p className="mt-2 text-sm leading-6 text-red-600">
                                        {errorMessage}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={clearErrorMessage}
                                    className="text-xs font-semibold text-red-500 transition-colors hover:text-red-700"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    ) : null}

                    {accounts.length === 0 ? (
                        <div className="flex flex-1 items-center justify-center bg-fumi-50 p-8">
                            <div className="mx-auto flex max-w-lg flex-col items-center text-center">
                                <div
                                    aria-hidden="true"
                                    className="mx-auto h-24 w-24 bg-fumi-600"
                                    style={{
                                        mask: `url("${emptyAddIcon}") center / contain no-repeat`,
                                        WebkitMask: `url("${emptyAddIcon}") center / contain no-repeat`,
                                    }}
                                />
                                <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.32em] text-fumi-500">
                                    No Accounts
                                </p>
                                <p className="mt-4 text-base leading-7 text-fumi-400">
                                    Add a{" "}
                                    <span className="font-semibold text-fumi-600">
                                        .ROBLOSECURITY
                                    </span>{" "}
                                    cookie to keep a Roblox account ready for
                                    quick launch whenever you need it.
                                </p>
                                <button
                                    type="button"
                                    onClick={openAddModal}
                                    className="app-select-none mt-6 inline-flex h-10 items-center gap-2 rounded-[0.8rem] border border-fumi-200 bg-fumi-600 px-4 text-sm font-semibold tracking-[0.01em] text-white transition-[background-color,border-color,transform] duration-150 ease-out hover:-translate-y-0.5 hover:border-fumi-700 hover:bg-fumi-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-2 focus-visible:ring-offset-fumi-50"
                                >
                                    <AppIcon
                                        icon={Add01Icon}
                                        size={16}
                                        strokeWidth={2.4}
                                    />
                                    Add Account
                                </button>
                            </div>
                        </div>
                    ) : (
                        accounts.map((account) => {
                            const isLaunching =
                                launchingAccountId === account.id;
                            const isDeleting = deletingAccountId === account.id;
                            const isMasked =
                                isStreamerModeEnabled &&
                                revealedAccountId !== account.id;
                            const accountDisplayName = getAccountRowDisplayName(
                                account,
                                {
                                    isMasked,
                                },
                            );
                            const accountIdentityLabel =
                                getAccountRowIdentityLabel(account, {
                                    isMasked,
                                });
                            const accountAvatarAltText =
                                getAccountAvatarAltText(account, { isMasked });
                            const identityBlurClassName = isMasked
                                ? "blur-[0.20rem]"
                                : "blur-0";

                            return (
                                <div
                                    key={account.id}
                                    className="flex flex-col justify-between gap-4 rounded-[1.35rem] border border-fumi-200 bg-fumi-50 p-4 shadow-[var(--shadow-app-card)] transition-colors hover:border-fumi-300 sm:flex-row sm:items-center"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-fumi-200 bg-fumi-100">
                                            {account.avatarUrl ? (
                                                <img
                                                    src={account.avatarUrl}
                                                    alt={accountAvatarAltText}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <AppIcon
                                                    icon={UserCircleIcon}
                                                    className="size-6 text-fumi-400"
                                                    strokeWidth={2}
                                                />
                                            )}
                                        </div>
                                        <div
                                            tabIndex={
                                                isStreamerModeEnabled ? 0 : -1
                                            }
                                            onPointerEnter={() =>
                                                handleRevealAccount(account.id)
                                            }
                                            onPointerLeave={(event) =>
                                                handleHideAccount(
                                                    account.id,
                                                    event.currentTarget,
                                                )
                                            }
                                            onFocus={() =>
                                                handleRevealAccount(account.id)
                                            }
                                            onBlur={(event) =>
                                                handleAccountRowBlur(
                                                    event,
                                                    account.id,
                                                )
                                            }
                                            className="min-w-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-fumi-600 focus-visible:outline-offset-2"
                                        >
                                            <div className="flex items-center gap-2">
                                                <h3
                                                    className={`truncate text-sm font-semibold tracking-[-0.01em] text-fumi-900 transition-[filter] duration-150 ${identityBlurClassName}`}
                                                >
                                                    {accountDisplayName}
                                                </h3>
                                                <span
                                                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] ${getAccountStatusTone(account)}`}
                                                >
                                                    {getAccountStatusLabel(
                                                        account,
                                                    )}
                                                </span>
                                                {account.boundPort !== null ? (
                                                    <span className="inline-flex items-center rounded-full border border-fumi-200 bg-fumi-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-fumi-600">
                                                        Port {account.boundPort}
                                                    </span>
                                                ) : null}
                                            </div>
                                            <p
                                                className={`mt-1 text-xs text-fumi-500 transition-[filter] duration-150 ${identityBlurClassName}`}
                                            >
                                                {accountIdentityLabel}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                void launchAccount(account.id);
                                            }}
                                            disabled={isLaunching || isDeleting}
                                            className="app-select-none flex h-8 items-center gap-2 rounded-[0.65rem] bg-fumi-100 px-3 text-xs font-semibold text-fumi-600 transition-colors hover:bg-fumi-200 disabled:pointer-events-none disabled:opacity-50"
                                        >
                                            <AppIcon
                                                icon={PlayIcon}
                                                className="size-[1.1rem]"
                                                strokeWidth={2}
                                            />
                                            {isLaunching
                                                ? "Launching..."
                                                : "Launch"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                void handleDeleteAccount(
                                                    account,
                                                );
                                            }}
                                            disabled={isLaunching || isDeleting}
                                            className="app-select-none flex size-8 items-center justify-center rounded-[0.65rem] text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:pointer-events-none disabled:opacity-50"
                                            title="Delete Account"
                                        >
                                            <AppIcon
                                                icon={Delete02Icon}
                                                className="size-[1.1rem]"
                                                strokeWidth={2}
                                            />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
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

            {isAddModalOpen ? (
                <div className="absolute inset-0 z-10 flex items-center justify-center px-4">
                    <div className="w-full max-w-lg rounded-[0.9rem] border border-fumi-200 bg-fumi-50 p-5 shadow-[var(--shadow-app-floating)]">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-fumi-500">
                            Add Account
                        </p>
                        <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-fumi-900">
                            Save a Roblox cookie locally
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-fumi-400">
                            Paste a{" "}
                            <span className="font-semibold text-fumi-600">
                                .ROBLOSECURITY
                            </span>{" "}
                            cookie. Fumi will validate it, resolve the Roblox
                            profile, and store it in the app data folder.
                        </p>

                        <label className="mt-5 block">
                            <span className="mb-2 block text-xs font-semibold text-fumi-600">
                                Roblox Cookie
                            </span>
                            <textarea
                                value={draftCookie}
                                onChange={(event) => {
                                    setDraftCookie(event.target.value);
                                }}
                                rows={6}
                                placeholder="Paste your .ROBLOSECURITY cookie"
                                className="min-h-32 max-h-80 w-full resize-y rounded-[1rem] border border-fumi-200 bg-fumi-50 px-4 py-3 text-sm text-fumi-800 outline-none transition-[border-color,box-shadow] placeholder:text-fumi-400 focus:border-fumi-300 focus:ring-2 focus:ring-fumi-200"
                            />
                        </label>

                        <div className="mt-5 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={closeAddModal}
                                disabled={isSubmittingAdd}
                                className="app-select-none inline-flex h-9 items-center justify-center rounded-[0.75rem] border border-fumi-200 bg-fumi-50 px-4 text-xs font-semibold text-fumi-600 transition-colors hover:bg-fumi-100 disabled:pointer-events-none disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    void submitAddAccount();
                                }}
                                disabled={isSubmittingAdd}
                                className="app-select-none inline-flex h-9 items-center justify-center rounded-[0.75rem] bg-fumi-600 px-4 text-xs font-semibold text-fumi-50 transition-colors hover:bg-fumi-500 disabled:pointer-events-none disabled:opacity-50"
                            >
                                {isSubmittingAdd ? "Saving..." : "Save Account"}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </section>
    );
}
