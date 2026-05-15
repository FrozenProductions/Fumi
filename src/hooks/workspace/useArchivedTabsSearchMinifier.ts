import { useEffect, useReducer, useRef } from "react";
import {
    ARCHIVED_TABS_HEADER_EXIT_DURATION_MS,
    ARCHIVED_TABS_MINIFY_REMAINING_SCROLL_RANGE_PX,
} from "../../constants/workspace/archive";
import { usePresenceTransition } from "../shared/usePresenceTransition";
import type {
    ArchivedTabsSearchMinifierState,
    UseArchivedTabsSearchMinifierResult,
} from "./useArchivedTabsSearchMinifier.type";

function updateArchivedTabsSearchMinifierState(
    currentState: ArchivedTabsSearchMinifierState,
    nextState: Partial<ArchivedTabsSearchMinifierState>,
): ArchivedTabsSearchMinifierState {
    return {
        ...currentState,
        ...nextState,
    };
}

function getScrollableAncestor(element: HTMLElement): HTMLElement | null {
    let parent = element.parentElement;

    while (parent) {
        const overflowY = window.getComputedStyle(parent).overflowY;

        if (overflowY === "auto" || overflowY === "scroll") {
            return parent;
        }

        parent = parent.parentElement;
    }

    return null;
}

function getArchiveSettingsScrollRange(scrollRoot: HTMLElement | null): number {
    if (scrollRoot) {
        return scrollRoot.scrollHeight - scrollRoot.clientHeight;
    }

    return document.documentElement.scrollHeight - window.innerHeight;
}

function canMinifyArchiveSearch(
    scrollRange: number,
    searchContainerHeight: number,
): boolean {
    return (
        scrollRange >
        searchContainerHeight + ARCHIVED_TABS_MINIFY_REMAINING_SCROLL_RANGE_PX
    );
}

export function useArchivedTabsSearchMinifier(): UseArchivedTabsSearchMinifierResult {
    const sentinelRef = useRef<HTMLDivElement>(null);
    const searchContainerHeightRef = useRef(0);
    const [state, dispatchMinifierState] = useReducer(
        updateArchivedTabsSearchMinifierState,
        {
            isMinified: false,
            isExpandedFully: true,
        },
    );
    const { isExpandedFully, isMinified } = state;

    useEffect(() => {
        const element = sentinelRef.current;
        if (!element) {
            return;
        }

        const scrollRoot = getScrollableAncestor(element);
        const observer = new IntersectionObserver(
            ([entry]) => {
                const scrollRange = getArchiveSettingsScrollRange(scrollRoot);

                if (
                    !entry.isIntersecting &&
                    !canMinifyArchiveSearch(
                        scrollRange,
                        searchContainerHeightRef.current,
                    )
                ) {
                    dispatchMinifierState({ isMinified: false });
                    return;
                }

                dispatchMinifierState({ isMinified: !entry.isIntersecting });
            },
            {
                root: scrollRoot,
                threshold: 0,
                rootMargin: "0px",
            },
        );

        observer.observe(element);

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!isMinified) {
            const timer = setTimeout(
                () => dispatchMinifierState({ isExpandedFully: true }),
                150,
            );
            return () => clearTimeout(timer);
        }

        dispatchMinifierState({ isExpandedFully: false });
    }, [isMinified]);

    const { isPresent, isClosing } = usePresenceTransition({
        isOpen: !isMinified,
        exitDurationMs: ARCHIVED_TABS_HEADER_EXIT_DURATION_MS,
    });

    function handleSearchContainerRef(element: HTMLDivElement | null): void {
        if (!element) {
            return;
        }

        searchContainerHeightRef.current = element.offsetHeight;
    }

    return {
        handleSearchContainerRef,
        isClosing,
        isExpandedFully,
        isMinified,
        isPresent,
        sentinelRef,
    };
}
