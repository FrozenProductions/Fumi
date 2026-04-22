import type {
    ScriptLibraryContentMode,
    ScriptLibraryEntry,
    ScriptLibraryFilters,
    ScriptLibrarySort,
    ScriptLibraryViewFormat,
} from "../../lib/scriptLibrary/scriptLibrary.type";

export type ScriptLibraryCardActions = {
    hasWorkspace: boolean;
    isAddingToWorkspace: boolean;
    isAddedToWorkspace: boolean;
    isCopyingScript: boolean;
    isCopiedLink: boolean;
    isCopiedScript: boolean;
    isFavorite: boolean;
    onAddToWorkspace: () => void;
    onCopyLink: () => void;
    onCopyScript: () => void;
    onToggleFavorite: () => void;
};

export type ScriptLibraryCardProps = {
    script: ScriptLibraryEntry;
    viewFormat: ScriptLibraryViewFormat;
    actions: ScriptLibraryCardActions;
};

export type ScriptLibraryScreenProps = Record<string, never>;

export type ScriptLibraryToolbarProps = {
    contentMode: ScriptLibraryContentMode;
    favoriteCount: number;
    query: string;
    filters: ScriptLibraryFilters;
    orderBy: ScriptLibrarySort;
    viewFormat: ScriptLibraryViewFormat;
    onClearFavorites: () => void;
    onContentModeChange: (contentMode: ScriptLibraryContentMode) => void;
    onQueryChange: (query: string) => void;
    onToggleFilter: (filterKey: keyof ScriptLibraryFilters) => void;
    onOrderByChange: (orderBy: ScriptLibrarySort) => void;
    onViewFormatChange: (viewFormat: ScriptLibraryViewFormat) => void;
};

export type ScriptLibraryEmptyState = {
    eyebrow: string;
    title: string;
    description: string;
};
