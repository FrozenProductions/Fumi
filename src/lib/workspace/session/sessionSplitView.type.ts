export type WorkspaceSplitDirection = "horizontal" | "vertical";

export type WorkspaceSplitPlacement = "left" | "right" | "top" | "bottom";

export type WorkspaceSplitPaneNode = {
    type: "pane";
    id: string;
    activeTabId: string | null;
    tabIds: string[];
};

export type WorkspaceSplitGroupNode = {
    type: "split";
    id: string;
    direction: WorkspaceSplitDirection;
    children: WorkspaceSplitNode[];
    ratios: number[];
};

export type WorkspaceSplitNode =
    | WorkspaceSplitPaneNode
    | WorkspaceSplitGroupNode;

export type WorkspaceSplitView = Partial<WorkspaceLegacySplitView> & {
    root?: WorkspaceSplitNode;
    activePaneId?: string;
};

export type WorkspaceLegacyPaneId = "primary" | "secondary";

export type WorkspaceLegacySplitView = {
    direction?: WorkspaceSplitDirection;
    primaryTabId: string;
    secondaryTabId: string;
    secondaryTabIds?: string[];
    splitRatio?: number;
    focusedPane?: WorkspaceLegacyPaneId;
};
