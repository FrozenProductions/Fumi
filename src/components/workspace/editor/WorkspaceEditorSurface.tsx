import type { ReactElement } from "react";
import { useEffect, useRef } from "react";
import {
    WORKSPACE_EDITOR_OPTIONS,
    WORKSPACE_EDITOR_PROPS,
    WORKSPACE_EDITOR_STYLE,
} from "../../../constants/workspace/editor";
import type {
    AceChangeDelta,
    AceEditorInstance,
} from "../../../lib/workspace/codeCompletion/ace.type";
import { applyAceEditorIndentSettings } from "../../../lib/workspace/editor/editor";
import type { WorkspaceOutlineChange } from "../../../lib/workspace/outline/outline.type";
import { WorkspaceActionsButton } from "../actions/WorkspaceActionsButton";
import { AppCodeCompletion } from "./AppCodeCompletion";
import { WorkspaceEditorSearchPanel } from "./search/WorkspaceEditorSearchPanel";
import type {
    WorkspaceAcePaneProps,
    WorkspaceEditorSurfaceProps,
    WorkspaceSplitDropZoneProps,
} from "./workspaceEditor.type";

function WorkspaceAcePane({
    AceEditorComponent,
    aceRuntime,
    appTheme,
    createHandleEditorChange,
    createHandleEditorLoad,
    createHandleEditorUnmount,
    createHandleScroll,
    editorFontSize,
    isWordWrapEnabled,
    isTabsToSpacesEnabled,
    isActiveTab,
    isVisible,
    onActiveTabLuauChange,
    tab,
    tabSize,
}: WorkspaceAcePaneProps): ReactElement {
    const editorRef = useRef<AceEditorInstance | null>(null);
    const editorChangeHandler = createHandleEditorChange(tab.id);
    const editorOptions = {
        ...WORKSPACE_EDITOR_OPTIONS,
        useSoftTabs: isTabsToSpacesEnabled,
    } as const;

    useEffect(() => {
        const editor = editorRef.current;

        if (!editor) {
            return;
        }

        applyAceEditorIndentSettings(editor, {
            isTabsToSpacesEnabled,
            tabSize,
        });
    }, [isTabsToSpacesEnabled, tabSize]);

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
                onLoad={(editor: AceEditorInstance) => {
                    editorRef.current = editor;
                    applyAceEditorIndentSettings(editor, {
                        isTabsToSpacesEnabled,
                        tabSize,
                    });
                    createHandleEditorLoad(tab.id)(editor);
                }}
                onChange={(value: string, delta?: AceChangeDelta) => {
                    if (isActiveTab) {
                        onActiveTabLuauChange(normalizeOutlineChange(delta));
                    }

                    editorChangeHandler(value, delta);
                }}
                onScroll={createHandleScroll(tab.id)}
                enableBasicAutocompletion={false}
                enableLiveAutocompletion={false}
                enableSnippets={false}
                fontSize={editorFontSize}
                showGutter
                showPrintMargin={false}
                highlightActiveLine
                tabSize={tabSize}
                wrapEnabled={isWordWrapEnabled}
                setOptions={editorOptions}
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

/**
 * Lays out Ace editor panes, split-view controls, completion popup, and search panel.
 *
 * @param props - Component props
 */
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
        isTabsToSpacesEnabled,
        searchPanel,
        tabSize,
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
                                      isTabsToSpacesEnabled={
                                          isTabsToSpacesEnabled
                                      }
                                      isActiveTab={tab.id === activeTabId}
                                      isVisible={isVisible}
                                      onActiveTabLuauChange={
                                          onActiveTabLuauChange
                                      }
                                      tab={tab}
                                      tabSize={tabSize}
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
