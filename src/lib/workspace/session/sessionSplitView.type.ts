export type WorkspacePaneId = "primary" | "secondary";

export type WorkspaceSplitView = {
    direction: "vertical";
    primaryTabId: string;
    secondaryTabId: string;
    secondaryTabIds: string[];
    splitRatio: number;
    focusedPane: WorkspacePaneId;
};
