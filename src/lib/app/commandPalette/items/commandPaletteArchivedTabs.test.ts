import { describe, expect, it, vi } from "vite-plus/test";
import {
    getArchivedTabCommandPaletteItems,
    getDeleteArchivedTabCommandPaletteItems,
} from "../commandPaletteModes";
import { createWorkspaceSession } from "../commandPaletteTestSupport";

describe("getArchivedTabCommandPaletteItems", () => {
    it("builds restore items for archived workspace tabs", () => {
        const onOpenWorkspaceScreen = vi.fn();
        const restoreArchivedWorkspaceTab = vi
            .fn()
            .mockResolvedValue(undefined);

        const items = getArchivedTabCommandPaletteItems({
            workspaceSession: createWorkspaceSession({
                state: {
                    workspace: {
                        workspacePath: "/workspace/current",
                        workspaceName: "current",
                        activeTabId: null,
                        splitView: null,
                        tabs: [],
                        archivedTabs: [
                            {
                                id: "archived-tab-1",
                                fileName: "archived.lua",
                                archivedAt: 123,
                                cursor: {
                                    line: 0,
                                    column: 0,
                                    scrollTop: 0,
                                },
                            },
                        ],
                        executionHistory: [],
                    },
                },
                archiveActions: {
                    restoreArchivedWorkspaceTab,
                },
            }),
            onOpenWorkspaceScreen,
        });

        expect(items).toHaveLength(1);
        expect(items[0]).toMatchObject({
            id: "command-restore-archived-tab-archived-tab-1",
            label: "archived.lua",
        });
        expect(items[0]?.isDisabled).toBeUndefined();

        items[0]?.onSelect();

        expect(onOpenWorkspaceScreen).toHaveBeenCalledOnce();
        expect(restoreArchivedWorkspaceTab).toHaveBeenCalledWith(
            "archived-tab-1",
        );
    });

    it("returns a disabled empty state without archived tabs", () => {
        const items = getArchivedTabCommandPaletteItems({
            workspaceSession: createWorkspaceSession({
                state: {
                    workspace: {
                        workspacePath: "/workspace/current",
                        workspaceName: "current",
                        activeTabId: null,
                        splitView: null,
                        tabs: [],
                        archivedTabs: [],
                        executionHistory: [],
                    },
                },
            }),
            onOpenWorkspaceScreen: vi.fn(),
        });

        expect(items).toEqual([
            expect.objectContaining({
                id: "command-restore-archived-tab-empty",
                isDisabled: true,
            }),
        ]);
    });

    it("builds delete items for archived workspace tabs", () => {
        const onOpenWorkspaceScreen = vi.fn();
        const deleteArchivedWorkspaceTab = vi.fn().mockResolvedValue(undefined);

        const items = getDeleteArchivedTabCommandPaletteItems({
            workspaceSession: createWorkspaceSession({
                state: {
                    workspace: {
                        workspacePath: "/workspace/current",
                        workspaceName: "current",
                        activeTabId: null,
                        splitView: null,
                        tabs: [],
                        archivedTabs: [
                            {
                                id: "archived-tab-1",
                                fileName: "archived.lua",
                                archivedAt: 123,
                                cursor: {
                                    line: 0,
                                    column: 0,
                                    scrollTop: 0,
                                },
                            },
                        ],
                        executionHistory: [],
                    },
                },
                archiveActions: {
                    deleteArchivedWorkspaceTab,
                },
            }),
            onOpenWorkspaceScreen,
        });

        expect(items).toHaveLength(1);
        expect(items[0]).toMatchObject({
            id: "command-delete-archived-tab-archived-tab-1",
            label: "archived.lua",
        });
        expect(items[0]?.isDisabled).toBeUndefined();

        items[0]?.onSelect();

        expect(onOpenWorkspaceScreen).toHaveBeenCalledOnce();
        expect(deleteArchivedWorkspaceTab).toHaveBeenCalledWith(
            "archived-tab-1",
        );
    });

    it("returns a disabled delete empty state without archived tabs", () => {
        const items = getDeleteArchivedTabCommandPaletteItems({
            workspaceSession: createWorkspaceSession({
                state: {
                    workspace: {
                        workspacePath: "/workspace/current",
                        workspaceName: "current",
                        activeTabId: null,
                        splitView: null,
                        tabs: [],
                        archivedTabs: [],
                        executionHistory: [],
                    },
                },
            }),
            onOpenWorkspaceScreen: vi.fn(),
        });

        expect(items).toEqual([
            expect.objectContaining({
                id: "command-delete-archived-tab-empty",
                isDisabled: true,
            }),
        ]);
    });
});
