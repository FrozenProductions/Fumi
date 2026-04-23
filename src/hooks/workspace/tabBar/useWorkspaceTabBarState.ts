import type { MouseEvent as ReactMouseEvent, RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import type { WorkspaceTabContextMenuState } from "../../../components/workspace/workspaceTabBar.type";
import { useWorkspaceUiStore } from "../useWorkspaceUiStore";

type UseWorkspaceTabBarStateOptions = {
    activeTabId: string | null;
};

type UseWorkspaceTabBarStateResult = {
    refs: {
        tabBarRef: RefObject<HTMLDivElement | null>;
        tabListContainerRef: RefObject<HTMLDivElement | null>;
        tabListDropdownRef: RefObject<HTMLDivElement | null>;
    };
    state: {
        contextMenuState: WorkspaceTabContextMenuState | null;
        contextMenuPosition: {
            x: number;
            y: number;
        };
        isTabListOpen: boolean;
    };
    actions: {
        closeContextMenu: () => void;
        closeTabList: () => void;
        openContextMenu: (
            tabId: string,
            event: ReactMouseEvent<HTMLDivElement>,
        ) => void;
        toggleTabList: () => void;
    };
};

function isTabFullyVisible(
    container: HTMLElement,
    tabElement: HTMLElement,
): boolean {
    const containerRect = container.getBoundingClientRect();
    const tabRect = tabElement.getBoundingClientRect();

    return (
        tabRect.left >= containerRect.left &&
        tabRect.right <= containerRect.right
    );
}

/**
 * Owns tab bar UI state such as the tab list dropdown, context menu, and active-tab scrolling.
 *
 * @param options - Hook options
 * @param options.activeTabId - The currently active tab ID, used for scroll-into-view
 * @returns Tab bar refs, state, and action functions
 */
export function useWorkspaceTabBarState({
    activeTabId,
}: UseWorkspaceTabBarStateOptions): UseWorkspaceTabBarStateResult {
    const tabBarRef = useRef<HTMLDivElement | null>(null);
    const tabListContainerRef = useRef<HTMLDivElement | null>(null);
    const tabListDropdownRef = useRef<HTMLDivElement | null>(null);
    const [contextMenuState, setContextMenuState] =
        useState<WorkspaceTabContextMenuState | null>(null);
    const isTabListOpen = useWorkspaceUiStore((state) => state.isTabListOpen);
    const closeTabList = useWorkspaceUiStore((state) => state.closeTabList);
    const toggleTabList = useWorkspaceUiStore((state) => state.toggleTabList);

    useEffect(() => {
        if (!isTabListOpen) {
            return;
        }

        const handleClickOutside = (event: MouseEvent): void => {
            if (
                tabListDropdownRef.current?.contains(event.target as Node) ??
                false
            ) {
                return;
            }

            closeTabList();
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [closeTabList, isTabListOpen]);

    useEffect(() => {
        if (!contextMenuState) {
            return;
        }

        const handleWindowBlur = (): void => {
            setContextMenuState(null);
        };

        window.addEventListener("blur", handleWindowBlur);

        return () => {
            window.removeEventListener("blur", handleWindowBlur);
        };
    }, [contextMenuState]);

    useEffect(() => {
        if (!activeTabId) {
            return;
        }

        const animationFrameId = window.requestAnimationFrame(() => {
            const tabListContainer = tabListContainerRef.current;

            if (!tabListContainer) {
                return;
            }

            const tabElement = tabListContainer.querySelector<HTMLElement>(
                `[data-tab-id="${activeTabId}"]`,
            );

            if (
                !tabElement ||
                isTabFullyVisible(tabListContainer, tabElement)
            ) {
                return;
            }

            tabElement.scrollIntoView({
                behavior: "auto",
                block: "nearest",
                inline: "nearest",
            });
        });

        return () => {
            window.cancelAnimationFrame(animationFrameId);
        };
    }, [activeTabId]);

    const openContextMenu = (
        tabId: string,
        event: ReactMouseEvent<HTMLDivElement>,
    ): void => {
        event.preventDefault();
        const tabRect = event.currentTarget.getBoundingClientRect();
        const tabBarRect = tabBarRef.current?.getBoundingClientRect();
        const offsetLeft = tabBarRect?.left ?? 0;
        const offsetTop = tabBarRect?.top ?? 0;

        closeTabList();
        setContextMenuState({
            tabId,
            x: tabRect.left - offsetLeft - 2,
            y: tabRect.bottom - offsetTop + 2,
        });
    };

    const closeContextMenu = (): void => {
        setContextMenuState(null);
    };

    return {
        refs: {
            tabBarRef,
            tabListContainerRef,
            tabListDropdownRef,
        },
        state: {
            contextMenuState,
            contextMenuPosition: {
                x: contextMenuState?.x ?? 0,
                y: contextMenuState?.y ?? 0,
            },
            isTabListOpen,
        },
        actions: {
            closeContextMenu,
            closeTabList,
            openContextMenu,
            toggleTabList,
        },
    };
}
