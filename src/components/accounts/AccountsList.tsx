import {
    Delete02Icon,
    PlayIcon,
    UserCircleIcon,
} from "@hugeicons/core-free-icons";
import type { ReactElement } from "react";
import {
    getAccountAvatarAltText,
    getAccountRowDisplayName,
    getAccountRowIdentityLabel,
} from "../../lib/accounts/accountPrivacy";
import { AppIcon } from "../app/common/AppIcon";
import type { AccountsListProps } from "./accountsScreen.type";

function getAccountStatusTone(
    account: AccountsListProps["accounts"][number],
): string {
    return account.boundPort !== null
        ? "border-emerald-200 bg-emerald-50 text-emerald-600"
        : "border-fumi-200 bg-fumi-100 text-fumi-500";
}

function getAccountStatusLabel(
    account: AccountsListProps["accounts"][number],
): string {
    return account.boundPort !== null ? "Active" : "Offline";
}

export function AccountsList({
    accounts,
    deletingAccountId,
    isStreamerModeEnabled,
    launchingAccountId,
    revealedAccountId,
    onDeleteAccount,
    onHideAccount,
    onLaunchAccount,
    onRevealAccount,
    onRowBlur,
}: AccountsListProps): ReactElement {
    return (
        <>
            {accounts.map((account) => {
                const isLaunching = launchingAccountId === account.id;
                const isDeleting = deletingAccountId === account.id;
                const isMasked =
                    isStreamerModeEnabled && revealedAccountId !== account.id;
                const accountDisplayName = getAccountRowDisplayName(account, {
                    isMasked,
                });
                const accountIdentityLabel = getAccountRowIdentityLabel(
                    account,
                    {
                        isMasked,
                    },
                );
                const accountAvatarAltText = getAccountAvatarAltText(account, {
                    isMasked,
                });
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
                                tabIndex={isStreamerModeEnabled ? 0 : -1}
                                onPointerEnter={() =>
                                    onRevealAccount(account.id)
                                }
                                onPointerLeave={(event) =>
                                    onHideAccount(
                                        account.id,
                                        event.currentTarget,
                                    )
                                }
                                onFocus={() => onRevealAccount(account.id)}
                                onBlur={(event) => onRowBlur(event, account.id)}
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
                                        {getAccountStatusLabel(account)}
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
                                    void onLaunchAccount(account.id);
                                }}
                                disabled={isLaunching || isDeleting}
                                className="app-select-none flex h-8 items-center gap-2 rounded-[0.65rem] bg-fumi-100 px-3 text-xs font-semibold text-fumi-600 transition-colors hover:bg-fumi-200 disabled:pointer-events-none disabled:opacity-50"
                            >
                                <AppIcon
                                    icon={PlayIcon}
                                    className="size-[1.1rem]"
                                    strokeWidth={2}
                                />
                                {isLaunching ? "Launching..." : "Launch"}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    void onDeleteAccount(account);
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
            })}
        </>
    );
}
