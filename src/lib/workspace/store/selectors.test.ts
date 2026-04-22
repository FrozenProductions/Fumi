import { describe, expect, it } from "vite-plus/test";
import type { WorkspaceSession } from "../workspace.type";
import { selectWorkspaceScreenSession } from "./selectors";
import type { WorkspaceStore } from "./workspaceStore.type";

function createWorkspaceSession(
    workspacePath: string,
    overrides: Partial<WorkspaceSession> = {},
): WorkspaceSession {
    return {
        workspacePath,
        workspaceName: workspacePath.split("/").pop() ?? "workspace",
        activeTabId: "tab-1",
        splitView: null,
        tabs: [
            {
                id: "tab-1",
                fileName: "alpha.lua",
                content: "print('alpha')",
                savedContent: "print('alpha')",
                isDirty: false,
                cursor: {
                    line: 0,
                    column: 0,
                    scrollTop: 0,
                },
            },
        ],
        archivedTabs: [],
        executionHistory: [],
        ...overrides,
    };
}

function createWorkspaceStore(
    workspace: WorkspaceSession | null,
): WorkspaceStore {
    return {
        workspace,
    } as WorkspaceStore;
}

describe("selectWorkspaceScreenSession", () => {
    it("reuses the previous screen session when only dirty tab content changes", () => {
        const firstState = createWorkspaceStore(
            createWorkspaceSession("/workspace/content-a", {
                tabs: [
                    {
                        id: "tab-1",
                        fileName: "alpha.lua",
                        content: "print('first dirty value')",
                        savedContent: "print('saved')",
                        isDirty: true,
                        cursor: {
                            line: 0,
                            column: 0,
                            scrollTop: 0,
                        },
                    },
                ],
            }),
        );
        const secondState = createWorkspaceStore(
            createWorkspaceSession("/workspace/content-a", {
                tabs: [
                    {
                        id: "tab-1",
                        fileName: "alpha.lua",
                        content: "print('second dirty value')",
                        savedContent: "print('saved')",
                        isDirty: true,
                        cursor: {
                            line: 0,
                            column: 0,
                            scrollTop: 0,
                        },
                    },
                ],
            }),
        );

        const firstSession = selectWorkspaceScreenSession(firstState);
        const secondSession = selectWorkspaceScreenSession(secondState);

        expect(firstSession).not.toBeNull();
        expect(secondSession).toBe(firstSession);
    });

    it("reuses the previous screen session when only cursor metadata changes", () => {
        const firstState = createWorkspaceStore(
            createWorkspaceSession("/workspace/cursor-a"),
        );
        const secondState = createWorkspaceStore(
            createWorkspaceSession("/workspace/cursor-a", {
                tabs: [
                    {
                        id: "tab-1",
                        fileName: "alpha.lua",
                        content: "print('alpha')",
                        savedContent: "print('alpha')",
                        isDirty: false,
                        cursor: {
                            line: 4,
                            column: 12,
                            scrollTop: 128,
                        },
                    },
                ],
            }),
        );

        const firstSession = selectWorkspaceScreenSession(firstState);
        const secondSession = selectWorkspaceScreenSession(secondState);

        expect(firstSession).not.toBeNull();
        expect(secondSession).toBe(firstSession);
    });

    it("returns a new screen session when the visible tab shell changes", () => {
        const firstState = createWorkspaceStore(
            createWorkspaceSession("/workspace/dirty-toggle"),
        );
        const secondState = createWorkspaceStore(
            createWorkspaceSession("/workspace/dirty-toggle", {
                tabs: [
                    {
                        id: "tab-1",
                        fileName: "alpha.lua",
                        content: "print('modified')",
                        savedContent: "print('alpha')",
                        isDirty: true,
                        cursor: {
                            line: 0,
                            column: 0,
                            scrollTop: 0,
                        },
                    },
                ],
            }),
        );

        const firstSession = selectWorkspaceScreenSession(firstState);
        const secondSession = selectWorkspaceScreenSession(secondState);

        expect(firstSession).not.toBeNull();
        expect(secondSession).not.toBe(firstSession);
        expect(secondSession?.tabs[0]?.isDirty).toBe(true);
    });
});
