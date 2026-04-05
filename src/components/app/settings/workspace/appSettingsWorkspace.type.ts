import type { WorkspaceTabState } from "../../../../lib/workspace/workspace.type";

export type ArchivedTabActionButtonClassNames = {
    base: string;
    delete: string;
};

export type AppSettingsArchivedTabsListProps = {
    archivedTabs: WorkspaceTabState[];
    actionButtonClassNames: ArchivedTabActionButtonClassNames;
    dateFormatter: Intl.DateTimeFormat;
    onDeleteTab: (tabId: string) => void;
    onRestoreTab: (tabId: string) => void;
};

export type AppSettingsWorkspaceEmptyStateProps = {
    title: string;
    description: string;
};
