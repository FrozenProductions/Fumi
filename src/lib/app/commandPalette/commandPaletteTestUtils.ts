import { FolderOpenIcon } from "@hugeicons/core-free-icons";
import { vi } from "vite-plus/test";
import type {
    UseWorkspaceExecutorResult,
    WorkspaceExecutorActions,
    WorkspaceExecutorState,
} from "../../workspace/executor/executor.type";
import type {
    UseWorkspaceSessionResult,
    WorkspaceSessionArchiveActions,
    WorkspaceSessionEditorActions,
    WorkspaceSessionState,
    WorkspaceSessionTabActions,
    WorkspaceSessionWorkspaceActions,
} from "../../workspace/session.type";
import type { AppSidebarItem, AppSidebarPosition } from "../sidebar.type";
import type { getCommandCommandPaletteItems } from "./commandPalette";
import type { AppCommandPaletteItem } from "./commandPaletteDomain.type";

type WorkspaceSessionOverrides = {
    state?: Partial<WorkspaceSessionState>;
    workspaceActions?: Partial<WorkspaceSessionWorkspaceActions>;
    tabActions?: Partial<WorkspaceSessionTabActions>;
    archiveActions?: Partial<WorkspaceSessionArchiveActions>;
    editorActions?: Partial<WorkspaceSessionEditorActions>;
};

export type WorkspaceExecutorOverrides = {
    state?: Partial<WorkspaceExecutorState>;
    actions?: Partial<WorkspaceExecutorActions>;
};

export function createWorkspaceSession(
    overrides: WorkspaceSessionOverrides = {},
): UseWorkspaceSessionResult {
    return {
        state: {
            isBootstrapping: false,
            workspace: null,
            activeTab: null,
            activeTabIndex: -1,
            recentWorkspacePaths: [],
            errorMessage: null,
            hasUnsavedChanges: false,
            ...overrides.state,
        },
        workspaceActions: {
            openWorkspaceDirectory: vi.fn().mockResolvedValue(undefined),
            openWorkspacePath: vi.fn().mockResolvedValue(undefined),
            createWorkspaceFile: vi.fn().mockResolvedValue(undefined),
            addWorkspaceScriptTab: vi.fn().mockResolvedValue(false),
            importDroppedWorkspaceFiles: vi.fn().mockResolvedValue(false),
            ...overrides.workspaceActions,
        },
        tabActions: {
            duplicateWorkspaceTab: vi.fn().mockResolvedValue(undefined),
            archiveWorkspaceTab: vi.fn().mockResolvedValue(undefined),
            deleteWorkspaceTab: vi.fn().mockResolvedValue(undefined),
            renameWorkspaceTab: vi.fn().mockResolvedValue(false),
            selectWorkspaceTab: vi.fn(),
            reorderWorkspaceTab: vi.fn(),
            saveActiveWorkspaceTab: vi.fn().mockResolvedValue(undefined),
            openWorkspaceTabInPane: vi.fn(),
            setWorkspaceSplitRatio: vi.fn(),
            resetWorkspaceSplitView: vi.fn(),
            toggleWorkspaceSplitView: vi.fn(),
            focusWorkspacePane: vi.fn(),
            closeWorkspaceSplitView: vi.fn(),
            ...overrides.tabActions,
        },
        archiveActions: {
            restoreArchivedWorkspaceTab: vi.fn().mockResolvedValue(undefined),
            restoreAllArchivedWorkspaceTabs: vi
                .fn()
                .mockResolvedValue(undefined),
            deleteArchivedWorkspaceTab: vi.fn().mockResolvedValue(undefined),
            deleteAllArchivedWorkspaceTabs: vi
                .fn()
                .mockResolvedValue(undefined),
            ...overrides.archiveActions,
        },
        editorActions: {
            clearErrorMessage: vi.fn(),
            updateActiveTabContent: vi.fn(),
            updateActiveTabCursor: vi.fn(),
            updateActiveTabScrollTop: vi.fn(),
            ...overrides.editorActions,
        },
    };
}

export function createWorkspaceExecutor(
    overrides: WorkspaceExecutorOverrides = {},
): UseWorkspaceExecutorResult {
    const availablePorts = [
        5553, 5554, 5555, 5556, 5557, 5558, 5559, 5560, 5561, 5562,
    ];

    return {
        state: {
            executorKind: "macsploit",
            availablePorts,
            availablePortSummaries: availablePorts.map((port) => ({
                port,
                boundAccountId: null,
                boundAccountDisplayName: null,
                isBoundToUnknownAccount: false,
            })),
            hasSupportedExecutor: true,
            port: "5553",
            isAttached: false,
            didRecentAttachFail: false,
            isBusy: false,
            errorMessage: null,
            ...overrides.state,
        },
        actions: {
            updatePort: vi.fn(),
            clearErrorMessage: vi.fn(),
            attachToPort: vi.fn().mockResolvedValue(undefined),
            toggleConnection: vi.fn().mockResolvedValue(undefined),
            executeActiveTab: vi.fn().mockResolvedValue(undefined),
            executeHistoryEntry: vi.fn().mockResolvedValue(undefined),
            ...overrides.actions,
        },
    };
}

export function createCommandPaletteOptions(
    overrides: Partial<
        Parameters<typeof getCommandCommandPaletteItems>[0]
    > = {},
): Parameters<typeof getCommandCommandPaletteItems>[0] {
    return {
        workspaceSession: createWorkspaceSession(),
        workspaceExecutor: createWorkspaceExecutor(),
        isSidebarOpen: false,
        activeSidebarItem: "workspace" satisfies AppSidebarItem,
        sidebarPosition: "left" satisfies AppSidebarPosition,
        hotkeyLabels: {
            activateGoToLine: "Mod+Shift+\\",
            archiveWorkspaceTab: "Mod+W",
            toggleExecutorConnection: "Mod+Shift+C",
            createWorkspaceFile: "Mod+T",
            focusWorkspaceLeftPane: "Ctrl+Mod+1",
            focusWorkspaceRightPane: "Ctrl+Mod+2",
            killRoblox: "Mod+Shift+K",
            launchRoblox: "Mod+Shift+L",
            moveWorkspaceTabToLeftPane: "Ctrl+Mod+Left",
            moveWorkspaceTabToRightPane: "Ctrl+Mod+Right",
            openAccounts: "Mod+Shift+A",
            openSettings: "Mod+,",
            openWorkspaceDirectory: "Mod+O",
            openWorkspaceScreen: "Mod+Shift+W",
            openAutomaticExecution: "Mod+Shift+E",
            openScriptLibrary: "Mod+Shift+S",
            resetWorkspaceSplitView: "Ctrl+Mod+0",
            toggleOutlinePanel: "Mod+Shift+O",
            toggleSidebar: "Mod+B",
            toggleWorkspaceSplitView: "Mod+\\",
            toggleSidebarPosition: "",
        },
        onActivateGoToLineMode: vi.fn(),
        onActivateAttachMode: vi.fn(),
        onActivateThemeMode: vi.fn(),
        onOpenWorkspaceScreen: vi.fn(),
        onOpenAutomaticExecution: vi.fn(),
        onOpenScriptLibrary: vi.fn(),
        onOpenAccounts: vi.fn(),
        onOpenExecutionHistory: vi.fn(),
        onOpenSettings: vi.fn(),
        isOutlinePanelVisible: true,
        onToggleSidebar: vi.fn(),
        onToggleOutlinePanel: vi.fn(),
        onSetSidebarPosition: vi.fn(),
        onZoomIn: vi.fn(),
        onZoomOut: vi.fn(),
        onZoomReset: vi.fn(),
        onRequestRenameCurrentTab: vi.fn(),
        ...overrides,
    };
}

export function createAppCommandPaletteItem(
    overrides: Partial<AppCommandPaletteItem> &
        Pick<AppCommandPaletteItem, "id" | "label">,
): AppCommandPaletteItem {
    const { id, label, ...restOverrides } = overrides;

    return {
        id,
        label,
        description: "",
        icon: FolderOpenIcon,
        keywords: "",
        onSelect: vi.fn(),
        ...restOverrides,
    };
}
