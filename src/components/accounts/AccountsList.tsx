import type { ReactElement } from "react";
import { AccountListItem } from "./AccountListItem";
import type { AccountsListProps } from "./accountsScreen.type";

/**
 * Renders the list of Roblox accounts with status badges, launch, and delete controls.
 *
 * @param props - Component props
 */
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
            {accounts.map((account) => (
                <AccountListItem
                    key={account.id}
                    account={account}
                    deletingAccountId={deletingAccountId}
                    isStreamerModeEnabled={isStreamerModeEnabled}
                    launchingAccountId={launchingAccountId}
                    revealedAccountId={revealedAccountId}
                    onDeleteAccount={onDeleteAccount}
                    onHideAccount={onHideAccount}
                    onLaunchAccount={onLaunchAccount}
                    onRevealAccount={onRevealAccount}
                    onRowBlur={onRowBlur}
                />
            ))}
        </>
    );
}
