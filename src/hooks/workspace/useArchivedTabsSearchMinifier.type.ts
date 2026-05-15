export type UseArchivedTabsSearchMinifierResult = {
    handleSearchContainerRef: (element: HTMLDivElement | null) => void;
    isClosing: boolean;
    isExpandedFully: boolean;
    isMinified: boolean;
    isPresent: boolean;
    sentinelRef: React.RefObject<HTMLDivElement | null>;
};

export type ArchivedTabsSearchMinifierState = {
    isExpandedFully: boolean;
    isMinified: boolean;
};
