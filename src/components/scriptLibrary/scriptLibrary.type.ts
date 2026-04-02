import type {
    ScriptLibraryEntry,
    ScriptLibraryFilters,
    ScriptLibrarySort,
    ScriptLibraryViewFormat,
} from "../../lib/scriptLibrary/scriptLibrary.type";
import type { UseWorkspaceSessionResult } from "../../lib/workspace/workspace.type";

export type ScriptLibraryCardActions = {
    hasWorkspace: boolean;
    isAddingToWorkspace: boolean;
    isAddedToWorkspace: boolean;
    isCopyingScript: boolean;
    isCopiedLink: boolean;
    isCopiedScript: boolean;
    onAddToWorkspace: () => void;
    onCopyLink: () => void;
    onCopyScript: () => void;
};

export type ScriptLibraryCardProps = {
    script: ScriptLibraryEntry;
    viewFormat: ScriptLibraryViewFormat;
    actions: ScriptLibraryCardActions;
};

export type ScriptLibraryScreenProps = {
    workspaceSession: UseWorkspaceSessionResult;
};

export type ScriptLibraryToolbarProps = {
    query: string;
    filters: ScriptLibraryFilters;
    orderBy: ScriptLibrarySort;
    viewFormat: ScriptLibraryViewFormat;
    onQueryChange: (query: string) => void;
    onToggleFilter: (filterKey: keyof ScriptLibraryFilters) => void;
    onOrderByChange: (orderBy: ScriptLibrarySort) => void;
    onViewFormatChange: (viewFormat: ScriptLibraryViewFormat) => void;
};
