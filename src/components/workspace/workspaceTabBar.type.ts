import type { WorkspaceTabBarProps } from "./workspaceScreen.type";

export type { WorkspaceTabBarProps };

export type WorkspaceTabContextMenuState = {
    tabId: string;
    x: number;
    y: number;
};

export type WorkspaceTabBarDragCallbacks = {
    onDragPreview: (draggedTabId: string, targetTabId: string) => void;
    onDragStart: () => void;
    onDragEnd: (
        canceled: boolean,
        draggedTabId: string | undefined,
        rawTargetTabId: string | undefined,
    ) => void;
};

export type WorkspaceTabBarInternalProps = WorkspaceTabBarProps &
    WorkspaceTabBarDragCallbacks & {
        previewTabs: WorkspaceTabBarProps["workspace"]["tabs"];
        isTabDragActive: boolean;
    };
