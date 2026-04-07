import { describe, expect, it } from "vite-plus/test";
import {
    removeAccountSummary,
    sortAccounts,
    upsertAccountSummary,
} from "./accounts";
import type { AccountSummary } from "./accounts.type";

function account(
    id: string,
    overrides: Partial<AccountSummary> = {},
): AccountSummary {
    return {
        id,
        userId: Number(id.replace(/\D/g, "")) || 1,
        username: `user-${id}`,
        displayName: `User ${id}`,
        avatarUrl: null,
        status: "offline",
        lastLaunchedAt: null,
        ...overrides,
    };
}

describe("accounts list helpers", () => {
    it("sorts active accounts first and then by most recent launch", () => {
        const sorted = sortAccounts([
            account("two", { lastLaunchedAt: 5 }),
            account("one", { status: "active", lastLaunchedAt: 1 }),
            account("three", { lastLaunchedAt: 10 }),
        ]);

        expect(sorted.map((entry) => entry.id)).toEqual([
            "one",
            "three",
            "two",
        ]);
    });

    it("upserts an active account and clears any previous active state", () => {
        const nextAccounts = upsertAccountSummary(
            [
                account("one", { status: "active", lastLaunchedAt: 1 }),
                account("two", { status: "offline", lastLaunchedAt: 2 }),
            ],
            account("two", { status: "active", lastLaunchedAt: 3 }),
        );

        expect(nextAccounts).toEqual([
            account("two", { status: "active", lastLaunchedAt: 3 }),
            account("one", { status: "offline", lastLaunchedAt: 1 }),
        ]);
    });

    it("removes an account by id", () => {
        const nextAccounts = removeAccountSummary(
            [account("one"), account("two")],
            "one",
        );

        expect(nextAccounts).toEqual([account("two")]);
    });
});
