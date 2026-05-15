import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type {
    WorkspaceEditorOutlineProps,
    WorkspaceEditorPaneProps,
    WorkspaceEditorSplitViewProps,
} from "../../components/workspace/editor/WorkspaceEditorProps.type";
import {
    WORKSPACE_OUTLINE_PANEL_MAX_WIDTH,
    WORKSPACE_OUTLINE_PANEL_MIN_WIDTH,
} from "../../constants/workspace/outline";
import { loadAceRuntime } from "../../lib/luau/ace/loadAceRuntime";
import { getEditorModeForFileName } from "../../lib/luau/fileType";
import { getReactAceComponent } from "../../lib/workspace/editor/editor";
import type {
    UseWorkspaceEditorSurfaceResult,
    WorkspaceEditorRuntimeState,
} from "./useWorkspaceEditorSurface.type";

function updateWorkspaceEditorRuntimeState(
    currentState: WorkspaceEditorRuntimeState,
    nextState: Partial<WorkspaceEditorRuntimeState>,
): WorkspaceEditorRuntimeState {
    return {
        ...currentState,
        ...nextState,
    };
}

/**
 * Loads editor runtime and owns outline resize interactions for the workspace editor.
 */
export function useWorkspaceEditorSurface(options: {
    outline: WorkspaceEditorOutlineProps;
    pane: WorkspaceEditorPaneProps;
    splitViewState: WorkspaceEditorSplitViewProps;
}): UseWorkspaceEditorSurfaceResult {
    const { outline, pane } = options;
    const { activeTabId, tabs } = pane;
    const {
        isOutlinePanelVisible,
        sidebarPosition,
        outlinePanelWidth,
        onSetOutlinePanelWidth,
    } = outline;

    const [runtimeState, setRuntimeState] = useReducer(
        updateWorkspaceEditorRuntimeState,
        {
            AceEditorComponent: null,
            aceRuntime: null,
            isAceReady: false,
        },
    );
    const { AceEditorComponent, aceRuntime, isAceReady } = runtimeState;
    const editorContainerRef = useRef<HTMLDivElement | null>(null);
    const [outlinePanelPreviewWidth, setOutlinePanelPreviewWidth] = useState<
        number | null
    >(null);
    const outlineResizeCleanupRef = useRef<(() => void) | null>(null);
    const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? null;
    const activeEditorMode = activeTab
        ? getEditorModeForFileName(activeTab.fileName)
        : "text";
    const isOutlinePanelSupported = activeEditorMode === "luau";
    const resolvedOutlinePanelWidth =
        outlinePanelPreviewWidth ?? outlinePanelWidth;
    const isOutlineResizeActive = outlinePanelPreviewWidth !== null;
    const editorSurfaceStyle =
        isOutlinePanelSupported && isOutlinePanelVisible
            ? sidebarPosition === "right"
                ? ({
                      paddingLeft: `${resolvedOutlinePanelWidth}px`,
                  } satisfies CSSProperties)
                : ({
                      paddingRight: `${resolvedOutlinePanelWidth}px`,
                  } satisfies CSSProperties)
            : ({} satisfies CSSProperties);
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

    useEffect(() => {
        let isMounted = true;

        void (async () => {
            const [loadedAceRuntime, reactAceModule] = await Promise.all([
                loadAceRuntime(),
                import("react-ace"),
            ]);
            const reactAceComponent = getReactAceComponent(reactAceModule);

            if (isMounted) {
                setRuntimeState({
                    aceRuntime: loadedAceRuntime,
                    AceEditorComponent: reactAceComponent,
                    isAceReady: true,
                });
            }
        })();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        return () => {
            outlineResizeCleanupRef.current?.();
        };
    }, []);

    const handleOutlineResizePointerDown = useCallback(
        (event: ReactPointerEvent<HTMLButtonElement>): void => {
            event.preventDefault();
            event.stopPropagation();

            const pointerTarget = event.currentTarget;
            const startX = event.clientX;
            const initialOutlineWidth = outlinePanelWidth;
            const previousBodyStyle = document.body.style.cssText;

            pointerTarget.setPointerCapture(event.pointerId);
            document.body.style.cssText = `${previousBodyStyle}; cursor: col-resize; user-select: none;`;

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
                document.body.style.cssText = previousBodyStyle;
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
        },
        state: {
            AceEditorComponent,
            aceRuntime,
            activeTab,
            editorSurfaceStyle,
            isAceReady,
            isOutlinePanelSupported,
            outlinePanelClassName,
            outlinePanelStyle,
            tabs,
            workspaceActionsClassName,
            workspaceActionsStyle,
        },
        actions: {
            handleOutlineResizePointerDown,
        },
    };
}
