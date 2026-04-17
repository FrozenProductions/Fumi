import type { AccountSummary } from "./accounts.type";

function compareNullableNumbersDescending(
    left: number | null,
    right: number | null,
): number {
    if (left === right) {
        return 0;
    }

    if (left === null) {
        return 1;
    }

    if (right === null) {
        return -1;
    }

    return right - left;
}

export function sortAccounts(
    accounts: readonly AccountSummary[],
): AccountSummary[] {
    return [...accounts].sort((left, right) => {
        const leftIsActive = left.status === "active";
        const rightIsActive = right.status === "active";

        if (leftIsActive !== rightIsActive) {
            return leftIsActive ? -1 : 1;
        }

        return (
            compareNullableNumbersDescending(
                left.lastLaunchedAt,
                right.lastLaunchedAt,
            ) ||
            left.displayName.localeCompare(right.displayName) ||
            left.username.localeCompare(right.username)
        );
    });
}

export function upsertAccountSummary(
    accounts: readonly AccountSummary[],
    nextAccount: AccountSummary,
): AccountSummary[] {
    const existingIndex = accounts.findIndex(
        (account) => account.id === nextAccount.id,
    );
    const nextAccounts = [...accounts];

    if (existingIndex >= 0) {
        nextAccounts[existingIndex] = nextAccount;
        return sortAccounts(nextAccounts);
    }

    nextAccounts.push(nextAccount);
    return sortAccounts(nextAccounts);
}

export function removeAccountSummary(
    accounts: readonly AccountSummary[],
    accountId: string,
): AccountSummary[] {
    return sortAccounts(accounts.filter((account) => account.id !== accountId));
}
