import type { AppIconGlyph } from "../app/icon";

export type ScriptLibrarySort = "date" | "views" | "likes";

export type ScriptLibraryViewFormat = "grid" | "list";

export type ScriptLibraryFilters = {
    keyless: boolean;
    free: boolean;
    unpatched: boolean;
    verified: boolean;
};

export type ScriptLibraryFilterButton = {
    key: keyof ScriptLibraryFilters;
    label: string;
    icon: AppIconGlyph;
};

export type ScriptLibrarySortOption = {
    value: ScriptLibrarySort;
    label: string;
};

export type RscriptsUser = {
    _id?: string;
    username?: string | null;
    image?: string | null;
    verified?: boolean;
};

export type RscriptsGame = {
    _id?: string;
    title?: string | null;
    gameLogo?: string | null;
    imgurl?: string | null;
    gameLink?: string | null;
};

export type RscriptsListScript = {
    _id: string;
    title?: string | null;
    views?: number;
    private?: boolean;
    likes?: number;
    dislikes?: number;
    slug?: string | null;
    keySystem?: boolean | null;
    mobileReady?: boolean | null;
    lastUpdated?: string | null;
    createdAt?: string | null;
    discord?: string | null;
    paid?: boolean | null;
    description?: string | null;
    image?: string | null;
    rawScript?: string | null;
    unpatched?: boolean | null;
    creator?: string | null;
    user?: RscriptsUser | RscriptsUser[] | null;
    game?: RscriptsGame | null;
};

export type RscriptsListResponse = {
    scripts?: RscriptsListScript[];
    info?: {
        currentPage?: number;
        maxPages?: number;
    };
};

export type RscriptsScriptDetailResponse = {
    success?: {
        rawScript?: string | null;
    } | null;
    script?: {
        rawScript?: string | null;
    } | null;
    error?: string;
};

export type ScriptLibraryCreator = {
    name: string;
    image: string | null;
    verified: boolean;
};

export type ScriptLibraryEntry = {
    _id: string;
    title: string;
    description: string;
    createdAt: string;
    views: number;
    likes: number;
    slug: string;
    rawScript: string | null;
    image: string | null;
    paid: boolean;
    keySystem: boolean | null;
    mobileReady: boolean | null;
    unpatched: boolean;
    creator: ScriptLibraryCreator;
};
