import type { WorkspaceTabBarProps } from "./workspaceScreen.type";

export type { WorkspaceTabBarProps };

export type WorkspaceTabContextMenuState = {
    tabId: string;
    x: number;
    y: number;
};

export type WorkspaceTabBarInternalProps = WorkspaceTabBarProps & {
    previewTabs: WorkspaceTabBarProps["workspace"]["tabs"];
    isTabDragActive: boolean;
};
