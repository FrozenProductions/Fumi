import { describe, expect, it } from "vite-plus/test";
import type { WorkspaceExecutionHistoryEntry } from "../workspace.type";
import {
    getVisibleWorkspaceExecutionHistoryEntries,
    getWorkspaceExecutionHistoryAccountLabel,
    matchesWorkspaceExecutionHistoryFilters,
    searchWorkspaceExecutionHistoryEntries,
} from "./executionHistorySearch";

function createEntry(
    overrides: Partial<WorkspaceExecutionHistoryEntry>,
): WorkspaceExecutionHistoryEntry {
    return {
        id: "entry-1",
        executedAt: 1,
        executorKind: "macsploit",
        port: 5553,
        accountId: null,
        accountDisplayName: null,
        isBoundToUnknownAccount: false,
        fileName: "Main.lua",
        scriptContent: "print('hello')",
        ...overrides,
    };
}

describe("getWorkspaceExecutionHistoryAccountLabel", () => {
    it("prefers display name, then account id, then fallback labels", () => {
        expect(
            getWorkspaceExecutionHistoryAccountLabel(
                createEntry({
                    accountDisplayName: "Dayte",
                    accountId: "123",
                }),
            ),
        ).toBe("Dayte");
        expect(
            getWorkspaceExecutionHistoryAccountLabel(
                createEntry({ accountId: "123" }),
            ),
        ).toBe("123");
        expect(
            getWorkspaceExecutionHistoryAccountLabel(
                createEntry({ isBoundToUnknownAccount: true }),
            ),
        ).toBe("Unknown bound account");
        expect(getWorkspaceExecutionHistoryAccountLabel(createEntry({}))).toBe(
            "No account bound",
        );
    });
});

describe("matchesWorkspaceExecutionHistoryFilters", () => {
    it("shows every entry when no executor filters are active", () => {
        expect(
            matchesWorkspaceExecutionHistoryFilters(
                createEntry({ executorKind: "opiumware" }),
                "all",
            ),
        ).toBe(true);
    });

    it("matches the selected executor filter", () => {
        expect(
            matchesWorkspaceExecutionHistoryFilters(
                createEntry({ executorKind: "opiumware" }),
                "opiumware",
            ),
        ).toBe(true);
        expect(
            matchesWorkspaceExecutionHistoryFilters(
                createEntry({ executorKind: "macsploit" }),
                "opiumware",
            ),
        ).toBe(false);
    });
});

describe("searchWorkspaceExecutionHistoryEntries", () => {
    const entries = [
        createEntry({
            id: "file-match",
            fileName: "TeleportHelper.lua",
            scriptContent: "print('load')",
        }),
        createEntry({
            id: "account-match",
            accountDisplayName: "BuilderAccount",
            fileName: "Runner.lua",
        }),
        createEntry({
            id: "content-match",
            fileName: "Other.lua",
            scriptContent: "local target = 'teleport'",
        }),
    ];

    it("searches filenames, account labels, and script content", () => {
        expect(
            searchWorkspaceExecutionHistoryEntries(entries, "teleport").map(
                (entry) => entry.id,
            ),
        ).toEqual(["file-match", "content-match"]);
        expect(
            searchWorkspaceExecutionHistoryEntries(entries, "builder").map(
                (entry) => entry.id,
            ),
        ).toEqual(["account-match"]);
    });
});

describe("getVisibleWorkspaceExecutionHistoryEntries", () => {
    it("applies executor filters before search", () => {
        const entries = [
            createEntry({
                id: "macsploit-entry",
                executorKind: "macsploit",
                fileName: "Shared.lua",
            }),
            createEntry({
                id: "opiumware-entry",
                executorKind: "opiumware",
                fileName: "Shared.lua",
            }),
        ];

        expect(
            getVisibleWorkspaceExecutionHistoryEntries(entries, {
                filterValue: "opiumware",
                query: "shared",
            }).map((entry) => entry.id),
        ).toEqual(["opiumware-entry"]);
    });
});
