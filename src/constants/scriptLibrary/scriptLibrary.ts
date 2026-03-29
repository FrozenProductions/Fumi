import {
    CheckmarkCircle01Icon,
    Key01Icon,
    SquareUnlock01Icon,
    UserCheck01Icon,
} from "@hugeicons/core-free-icons";
import type {
    ScriptLibraryFilterButton,
    ScriptLibraryFilters,
    ScriptLibrarySortOption,
} from "../../types/scriptLibrary/scriptLibrary";

export const RSCRIPTS_API_BASE_URL = "https://rscripts.net/api/v2";
export const SCRIPT_LIBRARY_PAGE_SIZE = 16;

export const DEFAULT_SCRIPT_LIBRARY_FILTERS = {
    keyless: false,
    free: false,
    unpatched: false,
    verified: false,
} satisfies ScriptLibraryFilters;

export const SCRIPT_LIBRARY_FILTER_BUTTONS = [
    {
        key: "keyless",
        label: "Keyless",
        icon: Key01Icon,
    },
    {
        key: "free",
        label: "Free",
        icon: SquareUnlock01Icon,
    },
    {
        key: "unpatched",
        label: "Unpatched",
        icon: CheckmarkCircle01Icon,
    },
    {
        key: "verified",
        label: "Verified",
        icon: UserCheck01Icon,
    },
] satisfies ScriptLibraryFilterButton[];

export const SCRIPT_LIBRARY_SORT_OPTIONS = [
    { value: "date", label: "Latest" },
    { value: "views", label: "Most Viewed" },
    { value: "likes", label: "Most Liked" },
] satisfies ScriptLibrarySortOption[];
