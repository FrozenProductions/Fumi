import { FolderOpenIcon } from "@hugeicons/core-free-icons";
import { vi } from "vite-plus/test";
import { DEFAULT_APP_EDITOR_SETTINGS } from "../../../constants/app/settings";
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
} from "../../workspace/session/session.type";
import type { AppSidebarItem, AppSidebarPosition } from "../sidebar.type";
import type { AppCommandPaletteItem } from "./commandPaletteDomain.type";
import type { getCommandCommandPaletteItems } from "./commands/commandPaletteCommands";

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

/**
 * Creates a mock workspace session for testing.
 *
 * @param overrides - Optional overrides for session state and actions
 * @returns A mocked workspace session object
 */
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
            toggleWorkspaceTabPinned: vi.fn(),
            selectWorkspaceTab: vi.fn(),
            reorderWorkspaceTab: vi.fn(),
            saveActiveWorkspaceTab: vi.fn().mockResolvedValue(undefined),
            splitWorkspaceTab: vi.fn(),
            openWorkspaceTabInPane: vi.fn(),
            moveWorkspaceTabToPane: vi.fn(),
            setWorkspaceSplitDirection: vi.fn(),
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
            setErrorMessage: vi.fn(),
            updateActiveTabContent: vi.fn(),
            updateWorkspaceTabContent: vi.fn(),
            updateActiveTabCursor: vi.fn(),
            updateActiveTabScrollTop: vi.fn(),
            ...overrides.editorActions,
        },
    };
}

/**
 * Creates a mock workspace executor for testing.
 *
 * @param overrides - Optional overrides for executor state and actions
 * @returns A mocked workspace executor object
 */
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

/**
 * Creates mock command palette options for testing.
 *
 * @param overrides - Optional overrides for palette options
 * @returns Mocked command palette options
 */
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
            executeActiveTab: "Mod+Enter",
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
        editorSettings: DEFAULT_APP_EDITOR_SETTINGS,
        onActivateGoToLineMode: vi.fn(),
        onActivateAttachMode: vi.fn(),
        onActivateIntellisensePriorityMode: vi.fn(),
        onActivateSymbolMode: vi.fn(),
        onActivateTabSizeMode: vi.fn(),
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
        onSetEditorIntellisenseEnabled: vi.fn(),
        onSetEditorIntellisensePriority: vi.fn(),
        onSetEditorRelativeLineNumbersEnabled: vi.fn(),
        onSetEditorScopeHighlightingEnabled: vi.fn(),
        onSetEditorSmoothCaretEnabled: vi.fn(),
        onSetEditorTabSize: vi.fn(),
        onSetEditorWordWrapEnabled: vi.fn(),
        ...overrides,
    };
}

/**
 * Creates a mock command palette item for testing.
 *
 * @param overrides - Item configuration and overrides
 * @returns A mocked command palette item
 */
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
