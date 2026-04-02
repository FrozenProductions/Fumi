import type { UseWorkspaceCodeCompletionResult } from "../../hooks/workspace/useWorkspaceCodeCompletion";
import type { UseWorkspaceExecutorResult } from "../../hooks/workspace/useWorkspaceExecutor";
import type { UseWorkspaceTabRenameResult } from "../../hooks/workspace/useWorkspaceTabRename";
import type { AppIconGlyph, AppTheme } from "../../lib/app/app.type";
import type {
    LuauCompletionItem,
    LuauCompletionPopupPosition,
} from "../../lib/luau/luau.type";
import type {
    UseWorkspaceSessionResult,
    WorkspaceSession,
    WorkspaceTab,
} from "../../lib/workspace/workspace.type";

export type AppCodeCompletionProps = {
    items: LuauCompletionItem[];
    selectedIndex: number;
    position: LuauCompletionPopupPosition;
    onHoverItem: (index: number) => void;
    onSelectItem: (index: number) => void;
};

export type WorkspaceEditorProps = {
    activeTabId: string;
    appTheme: AppTheme;
    editorFontSize: number;
    tabs: WorkspaceTab[];
} & Pick<
    UseWorkspaceCodeCompletionResult,
    | "acceptCompletion"
    | "completionPopup"
    | "createHandleCursorChange"
    | "createHandleEditorChange"
    | "createHandleEditorLoad"
    | "createHandleScroll"
    | "handleCompletionHover"
>;

export type WorkspaceErrorBannerProps = {
    errorMessage: string;
};

export type WorkspaceMessageStateProps = {
    eyebrow: string;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
        icon: AppIconGlyph;
        shortcut?: string;
    };
};

export type WorkspaceScreenProps = {
    session: UseWorkspaceSessionResult;
    executor: UseWorkspaceExecutorResult;
};

export type WorkspaceTabBarProps = {
    workspace: WorkspaceSession;
    renameState: UseWorkspaceTabRenameResult;
    onCreateFile: () => void;
    onSelectTab: (tabId: string) => void;
    onReorderTab: (draggedTabId: string, targetTabId: string) => void;
    onArchiveTab: (tabId: string) => void;
};
