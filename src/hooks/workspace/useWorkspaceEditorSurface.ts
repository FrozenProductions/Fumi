import { useDroppable } from "@dnd-kit/react";
import type {
    CSSProperties,
    PointerEvent as ReactPointerEvent,
    RefObject,
} from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
    WorkspaceEditorOutlineProps,
    WorkspaceEditorPaneProps,
    WorkspaceEditorSplitViewProps,
} from "../../components/workspace/workspaceEditor.type";
import {
    WORKSPACE_OUTLINE_PANEL_MAX_WIDTH,
    WORKSPACE_OUTLINE_PANEL_MIN_WIDTH,
} from "../../constants/workspace/outline";
import {
    DEFAULT_WORKSPACE_SPLIT_RATIO,
    SPLIT_DROP_LEFT_ID,
    SPLIT_DROP_RIGHT_ID,
} from "../../constants/workspace/workspace";
import { getEditorModeForFileName } from "../../lib/luau/fileType";
import { loadAceRuntime } from "../../lib/luau/loadAceRuntime";
import type { LoadedAceRuntime } from "../../lib/luau/loadAceRuntime.type";
import { getReactAceComponent } from "../../lib/workspace/editor";
import type { AceEditorComponent } from "../../lib/workspace/editor.type";

type UseWorkspaceEditorSurfaceResult = {
    refs: {
        editorContainerRef: RefObject<HTMLDivElement | null>;
        leftDropRef: (element: HTMLDivElement | null) => void;
        rightDropRef: (element: HTMLDivElement | null) => void;
    };
    state: {
        AceEditorComponent: AceEditorComponent | null;
        aceRuntime: LoadedAceRuntime | null;
        activeTab: WorkspaceEditorPaneProps["tabs"][number] | null;
        isAceReady: boolean;
        isDropTarget: {
            left: boolean;
            right: boolean;
        };
        isOutlinePanelSupported: boolean;
        isSplit: boolean;
        outlinePanelClassName: string;
        outlinePanelStyle: CSSProperties;
        primaryTabId: string | null;
        secondaryTabId: string | null;
        splitDividerStyle: CSSProperties;
        tabs: WorkspaceEditorPaneProps["tabs"];
        visibleTabIds: Set<string | null>;
        workspaceActionsClassName: string;
        workspaceActionsStyle: CSSProperties;
    };
    actions: {
        getTabLayoutClass: (tabId: string) => string;
        getTabLayoutStyle: (tabId: string) => CSSProperties | undefined;
        handleOutlineResizePointerDown: (
            event: ReactPointerEvent<HTMLButtonElement>,
        ) => void;
        handleSplitResizePointerDown: (
            event: ReactPointerEvent<HTMLButtonElement>,
        ) => void;
    };
};

/**
 * Loads editor runtime and owns split/outline resize interactions for the workspace editor.
 */
export function useWorkspaceEditorSurface(options: {
    outline: WorkspaceEditorOutlineProps;
    pane: WorkspaceEditorPaneProps;
    splitViewState: WorkspaceEditorSplitViewProps;
}): UseWorkspaceEditorSurfaceResult {
    const { outline, pane, splitViewState } = options;
    const { activeTabId, tabs } = pane;
    const {
        isOutlinePanelVisible,
        sidebarPosition,
        outlinePanelWidth,
        onSetOutlinePanelWidth,
    } = outline;
    const {
        splitView,
        onResizeSplitPreview,
        onResizeSplitCommit,
        onResizeSplitCancel,
    } = splitViewState;

    const [isAceReady, setIsAceReady] = useState(false);
    const [AceEditorComponent, setAceEditorComponent] =
        useState<AceEditorComponent | null>(null);
    const [aceRuntime, setAceRuntime] = useState<LoadedAceRuntime | null>(null);
    const editorContainerRef = useRef<HTMLDivElement | null>(null);
    const [outlinePanelPreviewWidth, setOutlinePanelPreviewWidth] = useState<
        number | null
    >(null);
    const outlineResizeCleanupRef = useRef<(() => void) | null>(null);
    const splitResizeCleanupRef = useRef<(() => void) | null>(null);
    const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? null;
    const activeEditorMode = activeTab
        ? getEditorModeForFileName(activeTab.fileName)
        : "text";
    const isOutlinePanelSupported = activeEditorMode === "luau";
    const resolvedOutlinePanelWidth =
        outlinePanelPreviewWidth ?? outlinePanelWidth;
    const isOutlineResizeActive = outlinePanelPreviewWidth !== null;
    const workspaceActionsClassName = `pointer-events-none absolute bottom-5 z-40 ${
        sidebarPosition === "right"
            ? isOutlineResizeActive
                ? "left-5 transition-none"
                : "left-5 transition-[left] duration-200"
            : isOutlineResizeActive
              ? "right-5 transition-none"
              : "right-5 transition-[right] duration-200"
    }`;
    const workspaceActionsStyle =
        sidebarPosition === "right"
            ? {
                  left: isOutlinePanelVisible
                      ? `${resolvedOutlinePanelWidth + 20}px`
                      : "20px",
              }
            : {
                  right: isOutlinePanelVisible
                      ? `${resolvedOutlinePanelWidth + 20}px`
                      : "20px",
              };
    const outlinePanelClassName = `absolute top-0 bottom-0 z-30 flex min-w-0 overflow-hidden border-fumi-200 bg-fumi-50 transition-[opacity,transform] duration-300 ease-in-out ${
        sidebarPosition === "right" ? "left-0 border-r" : "right-0 border-l"
    } ${
        isOutlinePanelVisible
            ? "pointer-events-auto translate-x-0 opacity-100"
            : sidebarPosition === "right"
              ? "pointer-events-none -translate-x-full opacity-0"
              : "pointer-events-none translate-x-full opacity-0"
    }`;
    const outlinePanelStyle = {
        width: `${resolvedOutlinePanelWidth}px`,
    } satisfies CSSProperties;

    const { isDropTarget: isLeftDropTarget, ref: leftDropRef } = useDroppable({
        id: SPLIT_DROP_LEFT_ID,
    });
    const { isDropTarget: isRightDropTarget, ref: rightDropRef } = useDroppable(
        {
            id: SPLIT_DROP_RIGHT_ID,
        },
    );

    useEffect(() => {
        let isMounted = true;

        void (async () => {
            const loadedAceRuntime = await loadAceRuntime();
            const reactAceModule = await import("react-ace");
            const reactAceComponent = getReactAceComponent(reactAceModule);

            if (isMounted) {
                setAceRuntime(loadedAceRuntime);
                setAceEditorComponent(() => reactAceComponent);
                setIsAceReady(true);
            }
        })();

        return () => {
            isMounted = false;
        };
    }, []);

    const isSplit = splitView !== null;
    const primaryTabId = splitView?.primaryTabId ?? null;
    const secondaryTabId = splitView?.secondaryTabId ?? null;
    const splitRatio = splitView?.splitRatio ?? DEFAULT_WORKSPACE_SPLIT_RATIO;
    const primaryWidth = `${splitRatio * 100}%`;
    const secondaryWidth = `${(1 - splitRatio) * 100}%`;
    const dividerLeft = `${splitRatio * 100}%`;
    const splitDividerStyle = { left: dividerLeft } satisfies CSSProperties;
    const visibleTabIds = useMemo(() => {
        if (!isSplit) {
            return new Set([activeTabId]);
        }

        return new Set(
            [primaryTabId, secondaryTabId].filter(
                (tabId): tabId is string => tabId !== null,
            ),
        );
    }, [activeTabId, isSplit, primaryTabId, secondaryTabId]);

    const getTabLayoutClass = (tabId: string): string => {
        if (!isSplit) {
            const isVisible = tabId === activeTabId;
            return isVisible
                ? "absolute inset-0 z-10"
                : "absolute inset-0 pointer-events-none opacity-0";
        }

        if (tabId === primaryTabId) {
            return "absolute top-0 bottom-0 left-0 w-1/2 z-10";
        }

        if (tabId === secondaryTabId) {
            return "absolute top-0 bottom-0 right-0 w-1/2 z-10";
        }

        return "absolute inset-0 pointer-events-none opacity-0";
    };

    const getTabLayoutStyle = (tabId: string): CSSProperties | undefined => {
        if (!isSplit) {
            return undefined;
        }

        if (tabId === primaryTabId) {
            return {
                width: primaryWidth,
            } satisfies CSSProperties;
        }

        if (tabId === secondaryTabId) {
            return {
                width: secondaryWidth,
            } satisfies CSSProperties;
        }

        return undefined;
    };

    const handleSplitResizePointerDown = useCallback(
        (event: ReactPointerEvent<HTMLButtonElement>): void => {
            if (!splitView || !editorContainerRef.current) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            const container = editorContainerRef.current;
            const pointerTarget = event.currentTarget;
            const rect = container.getBoundingClientRect();

            if (rect.width <= 0) {
                return;
            }

            pointerTarget.setPointerCapture(event.pointerId);
            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";

            const getRawSplitRatio = (clientX: number): number =>
                (clientX - rect.left) / rect.width;

            const restoreBodyStyles = (): void => {
                document.body.style.cursor = "";
                document.body.style.userSelect = "";
            };

            const cleanup = (): void => {
                window.removeEventListener("pointermove", handlePointerMove);
                window.removeEventListener("pointerup", handlePointerUp);
                window.removeEventListener(
                    "pointercancel",
                    handlePointerCancel,
                );
                restoreBodyStyles();
                splitResizeCleanupRef.current = null;
            };

            const handlePointerMove = (moveEvent: PointerEvent): void => {
                onResizeSplitPreview(getRawSplitRatio(moveEvent.clientX));
            };

            const handlePointerUp = (upEvent: PointerEvent): void => {
                const nextSplitRatio = getRawSplitRatio(upEvent.clientX);
                cleanup();
                onResizeSplitCommit(nextSplitRatio);
            };

            const handlePointerCancel = (): void => {
                cleanup();
                onResizeSplitCancel();
            };

            splitResizeCleanupRef.current = cleanup;
            onResizeSplitPreview(getRawSplitRatio(event.clientX));
            window.addEventListener("pointermove", handlePointerMove);
            window.addEventListener("pointerup", handlePointerUp);
            window.addEventListener("pointercancel", handlePointerCancel);
        },
        [
            onResizeSplitCancel,
            onResizeSplitCommit,
            onResizeSplitPreview,
            splitView,
        ],
    );

    useEffect(() => {
        return () => {
            outlineResizeCleanupRef.current?.();
            splitResizeCleanupRef.current?.();
        };
    }, []);

    const handleOutlineResizePointerDown = useCallback(
        (event: ReactPointerEvent<HTMLButtonElement>): void => {
            event.preventDefault();
            event.stopPropagation();

            const pointerTarget = event.currentTarget;
            const startX = event.clientX;
            const initialOutlineWidth = outlinePanelWidth;

            pointerTarget.setPointerCapture(event.pointerId);
            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";

            const clampOutlineWidth = (width: number): number =>
                Math.min(
                    WORKSPACE_OUTLINE_PANEL_MAX_WIDTH,
                    Math.max(WORKSPACE_OUTLINE_PANEL_MIN_WIDTH, width),
                );

            const getWidth = (clientX: number): number => {
                const delta =
                    sidebarPosition === "right"
                        ? clientX - startX
                        : startX - clientX;
                return clampOutlineWidth(initialOutlineWidth + delta);
            };

            const restoreBodyStyles = (): void => {
                document.body.style.cursor = "";
                document.body.style.userSelect = "";
            };

            const cleanup = (): void => {
                window.removeEventListener("pointermove", handlePointerMove);
                window.removeEventListener("pointerup", handlePointerUp);
                window.removeEventListener(
                    "pointercancel",
                    handlePointerCancel,
                );
                restoreBodyStyles();
                outlineResizeCleanupRef.current = null;
            };

            const handlePointerMove = (moveEvent: PointerEvent): void => {
                setOutlinePanelPreviewWidth(getWidth(moveEvent.clientX));
            };

            const handlePointerUp = (upEvent: PointerEvent): void => {
                const nextWidth = getWidth(upEvent.clientX);
                cleanup();
                setOutlinePanelPreviewWidth(null);
                onSetOutlinePanelWidth(nextWidth);
            };

            const handlePointerCancel = (): void => {
                cleanup();
                setOutlinePanelPreviewWidth(null);
            };

            outlineResizeCleanupRef.current = cleanup;
            setOutlinePanelPreviewWidth(getWidth(event.clientX));
            window.addEventListener("pointermove", handlePointerMove);
            window.addEventListener("pointerup", handlePointerUp);
            window.addEventListener("pointercancel", handlePointerCancel);
        },
        [onSetOutlinePanelWidth, outlinePanelWidth, sidebarPosition],
    );

    return {
        refs: {
            editorContainerRef,
            leftDropRef,
            rightDropRef,
        },
        state: {
            AceEditorComponent,
            aceRuntime,
            activeTab,
            isAceReady,
            isDropTarget: {
                left: isLeftDropTarget,
                right: isRightDropTarget,
            },
            isOutlinePanelSupported,
            isSplit,
            outlinePanelClassName,
            outlinePanelStyle,
            primaryTabId,
            secondaryTabId,
            splitDividerStyle,
            tabs,
            visibleTabIds,
            workspaceActionsClassName,
            workspaceActionsStyle,
        },
        actions: {
            getTabLayoutClass,
            getTabLayoutStyle,
            handleOutlineResizePointerDown,
            handleSplitResizePointerDown,
        },
    };
}
