import type {
    CSSProperties,
    ReactElement,
    PointerEvent as ReactPointerEvent,
    RefObject,
} from "react";
import { useEffect } from "react";
import {
    WORKSPACE_EDITOR_OPTIONS,
    WORKSPACE_EDITOR_PROPS,
    WORKSPACE_EDITOR_STYLE,
} from "../../constants/workspace/editor";
import type { LoadedAceRuntime } from "../../lib/luau/loadAceRuntime.type";
import type { AceChangeDelta } from "../../lib/workspace/codeCompletion/ace.type";
import type { AceEditorComponent } from "../../lib/workspace/editor.type";
import type { WorkspaceOutlineChange } from "../../lib/workspace/outline.type";
import { AppCodeCompletion } from "./AppCodeCompletion";
import { WorkspaceActionsButton } from "./WorkspaceActionsButton";
import { WorkspaceEditorSearchPanel } from "./WorkspaceEditorSearchPanel";
import type {
    WorkspaceEditorCompletionProps,
    WorkspaceEditorOutlineProps,
    WorkspaceEditorPaneProps,
    WorkspaceEditorSplitViewProps,
    WorkspaceSplitDropZoneProps,
} from "./workspaceEditor.type";

type WorkspaceAcePaneProps = {
    AceEditorComponent: AceEditorComponent;
    aceRuntime: LoadedAceRuntime;
    appTheme: WorkspaceEditorPaneProps["appTheme"];
    createHandleCursorChange: WorkspaceEditorCompletionProps["createHandleCursorChange"];
    createHandleEditorChange: WorkspaceEditorCompletionProps["createHandleEditorChange"];
    createHandleEditorLoad: WorkspaceEditorCompletionProps["createHandleEditorLoad"];
    createHandleEditorUnmount: WorkspaceEditorCompletionProps["createHandleEditorUnmount"];
    createHandleScroll: WorkspaceEditorCompletionProps["createHandleScroll"];
    editorFontSize: number;
    isWordWrapEnabled: boolean;
    isActiveTab: boolean;
    isVisible: boolean;
    onActiveTabLuauChange: WorkspaceEditorOutlineProps["onActiveTabLuauChange"];
    tab: WorkspaceEditorPaneProps["tabs"][number];
};

type WorkspaceEditorSurfaceProps = {
    completion: WorkspaceEditorCompletionProps;
    outline: Pick<WorkspaceEditorOutlineProps, "onActiveTabLuauChange">;
    pane: WorkspaceEditorPaneProps;
    splitViewState: Pick<WorkspaceEditorSplitViewProps, "onFocusPane">;
    surface: {
        refs: {
            editorContainerRef: RefObject<HTMLDivElement | null>;
            leftDropRef: (element: HTMLDivElement | null) => void;
            rightDropRef: (element: HTMLDivElement | null) => void;
        };
        state: {
            AceEditorComponent: AceEditorComponent | null;
            aceRuntime: LoadedAceRuntime | null;
            isAceReady: boolean;
            isDropTarget: {
                left: boolean;
                right: boolean;
            };
            isSplit: boolean;
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
            handleSplitResizePointerDown: (
                event: ReactPointerEvent<HTMLButtonElement>,
            ) => void;
        };
    };
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
    isWordWrapEnabled,
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
                wrapEnabled={isWordWrapEnabled}
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
    const className =
        alignment === "left"
            ? "pointer-events-none absolute inset-y-0 left-0 z-30 w-1/2"
            : "pointer-events-none absolute inset-y-0 right-0 z-30 w-1/2";

    return (
        <div ref={dropRef} className={className}>
            {isDropTarget ? (
                <>
                    <div className="absolute inset-0 bg-fumi-400/10" />
                    <div className="absolute inset-2 rounded-lg border-2 border-fumi-500/40 bg-fumi-400/5" />
                </>
            ) : null}
        </div>
    );
}

export function WorkspaceEditorSurface({
    completion,
    outline,
    pane,
    splitViewState,
    surface,
}: WorkspaceEditorSurfaceProps): ReactElement {
    const {
        acceptCompletion,
        completionPopup,
        createHandleCursorChange,
        createHandleEditorChange,
        createHandleEditorLoad,
        createHandleEditorUnmount,
        createHandleScroll,
        handleCompletionHover,
    } = completion;
    const { onActiveTabLuauChange } = outline;
    const {
        activeTabId,
        appTheme,
        editorFontSize,
        isWordWrapEnabled,
        searchPanel,
        workspaceActionsButton,
    } = pane;
    const { onFocusPane } = splitViewState;
    const { editorContainerRef, leftDropRef, rightDropRef } = surface.refs;
    const {
        AceEditorComponent,
        aceRuntime,
        isAceReady,
        isDropTarget,
        isSplit,
        primaryTabId,
        secondaryTabId,
        splitDividerStyle,
        tabs,
        visibleTabIds,
        workspaceActionsClassName,
        workspaceActionsStyle,
    } = surface.state;
    const {
        getTabLayoutClass,
        getTabLayoutStyle,
        handleSplitResizePointerDown,
    } = surface.actions;

    return (
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
                        style={splitDividerStyle}
                        className="pointer-events-none absolute bottom-0 top-0 z-20 w-[1px] -translate-x-1/2 bg-fumi-200"
                    />
                    <button
                        type="button"
                        aria-label="Resize split view"
                        style={splitDividerStyle}
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
                isDropTarget={isDropTarget.left}
            />
            <WorkspaceSplitDropZone
                alignment="right"
                dropRef={rightDropRef}
                isDropTarget={isDropTarget.right}
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
                                                } else if (isSecondaryPane) {
                                                    onFocusPane("secondary");
                                                }
                                            }
                                          : undefined
                                  }
                              >
                                  <WorkspaceAcePane
                                      AceEditorComponent={AceEditorComponent}
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
                                      createHandleScroll={createHandleScroll}
                                      editorFontSize={editorFontSize}
                                      isWordWrapEnabled={isWordWrapEnabled}
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
                className={workspaceActionsClassName}
                style={workspaceActionsStyle}
            >
                <WorkspaceActionsButton {...workspaceActionsButton} />
            </div>
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
