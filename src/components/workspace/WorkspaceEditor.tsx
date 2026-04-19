import { useDroppable } from "@dnd-kit/react";
import type {
    CSSProperties,
    ReactElement,
    PointerEvent as ReactPointerEvent,
} from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    WORKSPACE_EDITOR_OPTIONS,
    WORKSPACE_EDITOR_PROPS,
    WORKSPACE_EDITOR_STYLE,
} from "../../constants/workspace/editor";
import {
    WORKSPACE_OUTLINE_PANEL_MAX_WIDTH,
    WORKSPACE_OUTLINE_PANEL_MIN_WIDTH,
} from "../../constants/workspace/outline";
import {
    DEFAULT_WORKSPACE_SPLIT_RATIO,
    SPLIT_DROP_LEFT_ID,
    SPLIT_DROP_RIGHT_ID,
} from "../../constants/workspace/workspace";
import type { AceChangeDelta } from "../../hooks/workspace/codeCompletion/ace.type";
import { getEditorModeForFileName } from "../../lib/luau/fileType";
import { loadAceRuntime } from "../../lib/luau/loadAceRuntime";
import type { LoadedAceRuntime } from "../../lib/luau/loadAceRuntime.type";
import type { LuauFileSymbol } from "../../lib/luau/luau.type";
import { getReactAceComponent } from "../../lib/workspace/editor";
import type { AceEditorComponent } from "../../lib/workspace/editor.type";
import { getWorkspaceLineNumberFromOffset } from "../../lib/workspace/outline";
import type { WorkspaceOutlineChange } from "../../lib/workspace/outline.type";
import { AppCodeCompletion } from "./AppCodeCompletion";
import { WorkspaceActionsButton } from "./WorkspaceActionsButton";
import { WorkspaceEditorSearchPanel } from "./WorkspaceEditorSearchPanel";
import { WorkspaceOutlinePanel } from "./WorkspaceOutlinePanel";
import type {
    WorkspaceEditorProps,
    WorkspaceSplitDropZoneProps,
} from "./workspaceEditor.type";

type WorkspaceAcePaneProps = {
    AceEditorComponent: AceEditorComponent;
    aceRuntime: LoadedAceRuntime;
    appTheme: WorkspaceEditorProps["appTheme"];
    createHandleCursorChange: WorkspaceEditorProps["createHandleCursorChange"];
    createHandleEditorChange: WorkspaceEditorProps["createHandleEditorChange"];
    createHandleEditorLoad: WorkspaceEditorProps["createHandleEditorLoad"];
    createHandleEditorUnmount: WorkspaceEditorProps["createHandleEditorUnmount"];
    createHandleScroll: WorkspaceEditorProps["createHandleScroll"];
    editorFontSize: number;
    isActiveTab: boolean;
    isVisible: boolean;
    onActiveTabLuauChange: WorkspaceEditorProps["onActiveTabLuauChange"];
    tab: WorkspaceEditorProps["tabs"][number];
};

function WorkspaceAcePane({
    AceEditorComponent,
    aceRuntime,
    appTheme,
    createHandleCursorChange,
    createHandleEditorChange,
    createHandleEditorLoad,
    createHandleEditorUnmount,
    createHandleScroll,
    editorFontSize,
    isActiveTab,
    isVisible,
    onActiveTabLuauChange,
    tab,
}: WorkspaceAcePaneProps): ReactElement {
    const editorChangeHandler = createHandleEditorChange(tab.id);

    useEffect(
        () => createHandleEditorUnmount(tab.id),
        [createHandleEditorUnmount, tab.id],
    );

    return (
        <div aria-hidden={!isVisible} className="absolute inset-0 z-10">
            <AceEditorComponent
                className="workspace-ace-editor"
                name={`workspace-editor-${tab.id}`}
                mode={aceRuntime.getMode(tab.fileName)}
                theme={aceRuntime.getTheme(appTheme)}
                width="100%"
                height="100%"
                value={tab.content}
                onLoad={createHandleEditorLoad(tab.id)}
                onChange={(value: string, delta?: AceChangeDelta) => {
                    if (isActiveTab) {
                        onActiveTabLuauChange(normalizeOutlineChange(delta));
                    }

                    editorChangeHandler(value, delta);
                }}
                onCursorChange={createHandleCursorChange(tab.id)}
                onScroll={createHandleScroll(tab.id)}
                enableBasicAutocompletion={false}
                enableLiveAutocompletion={false}
                enableSnippets={false}
                fontSize={editorFontSize}
                showGutter
                showPrintMargin={false}
                highlightActiveLine
                tabSize={4}
                wrapEnabled={false}
                setOptions={WORKSPACE_EDITOR_OPTIONS}
                editorProps={WORKSPACE_EDITOR_PROPS}
                style={WORKSPACE_EDITOR_STYLE}
            />
        </div>
    );
}

function WorkspaceSplitDropZone({
    alignment,
    dropRef,
    isDropTarget,
}: WorkspaceSplitDropZoneProps): ReactElement {
    return (
        <div
            ref={dropRef}
            className={[
                "pointer-events-none absolute inset-y-0 z-30 w-1/2",
                alignment === "left" ? "left-0" : "right-0",
            ].join(" ")}
        >
            {isDropTarget ? (
                <>
                    <div className="absolute inset-0 bg-fumi-400/10" />
                    <div className="absolute inset-2 rounded-lg border-2 border-fumi-500/40 bg-fumi-400/5" />
                </>
            ) : null}
        </div>
    );
}

/**
 * The main workspace editor with tab management, split view, and outline panel.
 *
 * @param props - Component props
 * @param props.activeTabId - Currently active tab ID
 * @param props.appTheme - Current app theme
 * @param props.editorFontSize - Editor font size
 * @param props.tabs - All workspace tabs
 * @param props.splitView - Current split view configuration
 * @param props.searchPanel - Search panel state
 * @param props.completionPopup - Code completion popup state
 * @param props.isOutlinePanelVisible - Whether outline panel is visible
 * @param props.luauSymbols - Luau symbols for outline
 * @returns A React component
 */
export function WorkspaceEditor({
    activeTabId,
    appTheme,
    editorFontSize,
    tabs,
    splitView,
    searchPanel,
    acceptCompletion,
    completionPopup,
    createHandleCursorChange,
    createHandleEditorChange,
    createHandleEditorLoad,
    createHandleEditorUnmount,
    createHandleScroll,
    handleCompletionHover,
    isOutlinePanelVisible,
    sidebarPosition,
    luauSymbols,
    outlinePanelWidth,
    outlineExpandedGroups,
    outlineSearchQuery,
    onToggleExpandedGroup,
    onExpandAllGroups,
    onCollapseAllGroups,
    onOutlineSearchQueryChange,
    onActiveTabLuauChange,
    onFocusPane,
    onSetOutlinePanelWidth,
    onResizeSplitPreview,
    onResizeSplitCommit,
    onResizeSplitCancel,
    goToLine,
    workspaceActionsButton,
}: WorkspaceEditorProps): ReactElement {
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

    const handleSelectSymbol = useCallback(
        (symbol: LuauFileSymbol): void => {
            const lineNumber = getWorkspaceLineNumberFromOffset(
                activeTab?.content ?? "",
                symbol.declarationStart,
            );
            goToLine(lineNumber);
        },
        [activeTab?.content, goToLine],
    );

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

    return (
        <div className="relative flex min-h-0 flex-1 bg-fumi-50">
            <div
                ref={editorContainerRef}
                className="relative flex min-h-0 flex-1 overflow-hidden"
            >
                {!isAceReady ? (
                    <div className="flex h-full w-full items-center justify-center bg-fumi-50 text-xs font-semibold uppercase tracking-[0.16em] text-fumi-400">
                        Loading editor
                    </div>
                ) : null}

                {isSplit ? (
                    <>
                        <div
                            style={{ left: dividerLeft }}
                            className="pointer-events-none absolute bottom-0 top-0 z-20 w-[1px] -translate-x-1/2 bg-fumi-200"
                        />
                        <button
                            type="button"
                            aria-label="Resize split view"
                            style={{ left: dividerLeft }}
                            className="absolute bottom-0 top-0 z-40 w-3 -translate-x-1/2 cursor-col-resize touch-none bg-transparent focus-visible:outline-none"
                            onPointerDown={handleSplitResizePointerDown}
                        >
                            <span className="absolute inset-y-0 left-1/2 w-[1px] -translate-x-1/2 bg-fumi-200" />
                        </button>
                    </>
                ) : null}

                <WorkspaceSplitDropZone
                    alignment="left"
                    dropRef={leftDropRef}
                    isDropTarget={isLeftDropTarget}
                />
                <WorkspaceSplitDropZone
                    alignment="right"
                    dropRef={rightDropRef}
                    isDropTarget={isRightDropTarget}
                />

                {AceEditorComponent && aceRuntime
                    ? tabs
                          .filter((tab) => visibleTabIds.has(tab.id))
                          .map((tab) => {
                              const layoutClass = getTabLayoutClass(tab.id);
                              const isPrimaryPane =
                                  isSplit && tab.id === primaryTabId;
                              const isSecondaryPane =
                                  isSplit && tab.id === secondaryTabId;
                              const isVisible = !isSplit
                                  ? tab.id === activeTabId
                                  : isPrimaryPane || isSecondaryPane;
                              return (
                                  <div
                                      key={tab.id}
                                      aria-hidden={!isVisible}
                                      className={layoutClass}
                                      style={getTabLayoutStyle(tab.id)}
                                      onClick={
                                          isSplit
                                              ? () => {
                                                    if (isPrimaryPane) {
                                                        onFocusPane("primary");
                                                    } else if (
                                                        isSecondaryPane
                                                    ) {
                                                        onFocusPane(
                                                            "secondary",
                                                        );
                                                    }
                                                }
                                              : undefined
                                      }
                                  >
                                      <WorkspaceAcePane
                                          AceEditorComponent={
                                              AceEditorComponent
                                          }
                                          aceRuntime={aceRuntime}
                                          appTheme={appTheme}
                                          createHandleCursorChange={
                                              createHandleCursorChange
                                          }
                                          createHandleEditorChange={
                                              createHandleEditorChange
                                          }
                                          createHandleEditorLoad={
                                              createHandleEditorLoad
                                          }
                                          createHandleEditorUnmount={
                                              createHandleEditorUnmount
                                          }
                                          createHandleScroll={
                                              createHandleScroll
                                          }
                                          editorFontSize={editorFontSize}
                                          isActiveTab={tab.id === activeTabId}
                                          isVisible={isVisible}
                                          onActiveTabLuauChange={
                                              onActiveTabLuauChange
                                          }
                                          tab={tab}
                                      />
                                  </div>
                              );
                          })
                    : null}
                {completionPopup ? (
                    <AppCodeCompletion
                        items={completionPopup.items}
                        selectedIndex={completionPopup.selectedIndex}
                        position={completionPopup.position}
                        onHoverItem={handleCompletionHover}
                        onSelectItem={acceptCompletion}
                    />
                ) : null}
                <div className="pointer-events-none absolute right-4 top-4 z-20">
                    <WorkspaceEditorSearchPanel searchPanel={searchPanel} />
                </div>

                <div
                    className={`pointer-events-none absolute bottom-5 z-40 ${
                        sidebarPosition === "right"
                            ? isOutlineResizeActive
                                ? "left-5 transition-none"
                                : "left-5 transition-[left] duration-200"
                            : isOutlineResizeActive
                              ? "right-5 transition-none"
                              : "right-5 transition-[right] duration-200"
                    }`}
                    style={
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
                              }
                    }
                >
                    <WorkspaceActionsButton {...workspaceActionsButton} />
                </div>
            </div>

            {isOutlinePanelSupported ? (
                <div
                    className={`absolute top-0 bottom-0 z-30 flex min-w-0 overflow-hidden border-fumi-200 bg-fumi-50 transition-[opacity,transform] duration-300 ease-in-out ${
                        sidebarPosition === "right"
                            ? "left-0 border-r"
                            : "right-0 border-l"
                    } ${
                        isOutlinePanelVisible
                            ? "pointer-events-auto translate-x-0 opacity-100"
                            : sidebarPosition === "right"
                              ? "pointer-events-none -translate-x-full opacity-0"
                              : "pointer-events-none translate-x-full opacity-0"
                    }`}
                    style={{ width: `${resolvedOutlinePanelWidth}px` }}
                >
                    <button
                        type="button"
                        aria-label="Resize outline panel"
                        className={`absolute inset-y-0 z-30 w-3 cursor-col-resize touch-none bg-transparent focus-visible:outline-none ${
                            sidebarPosition === "right"
                                ? "right-0 translate-x-1/2"
                                : "left-0 -translate-x-1/2"
                        }`}
                        onPointerDown={handleOutlineResizePointerDown}
                    >
                        <span className="absolute inset-y-0 left-1/2 w-[1px] -translate-x-1/2 bg-fumi-200" />
                    </button>
                    <div className="flex h-full min-w-0 flex-1">
                        <WorkspaceOutlinePanel
                            symbols={luauSymbols}
                            onSelectSymbol={handleSelectSymbol}
                            expandedGroups={outlineExpandedGroups}
                            onToggleExpandedGroup={onToggleExpandedGroup}
                            onExpandAllGroups={onExpandAllGroups}
                            onCollapseAllGroups={onCollapseAllGroups}
                            outlineSearchQuery={outlineSearchQuery}
                            onOutlineSearchQueryChange={
                                onOutlineSearchQueryChange
                            }
                        />
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function normalizeOutlineChange(
    delta?: AceChangeDelta,
): WorkspaceOutlineChange | null {
    if (
        !delta?.action ||
        !delta.start ||
        !delta.end ||
        !Array.isArray(delta.lines)
    ) {
        return null;
    }

    return {
        action: delta.action,
        end: delta.end,
        lines: delta.lines,
        start: delta.start,
    };
}
