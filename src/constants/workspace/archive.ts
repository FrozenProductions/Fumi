import type { ArchivedTabsSortOption } from "../../lib/workspace/workspace.type";

type ArchivedTabsSortOptionConfig = {
    value: ArchivedTabsSortOption;
    label: string;
};

export const ARCHIVED_TABS_SORT_OPTIONS = [
    { value: "dateDesc", label: "Date (Newest)" },
    { value: "dateAsc", label: "Date (Oldest)" },
    { value: "nameAsc", label: "Name (A-Z)" },
    { value: "nameDesc", label: "Name (Z-A)" },
] as const satisfies ArchivedTabsSortOptionConfig[];

export const ARCHIVED_TABS_HEADER_EXIT_DURATION_MS = 150;
