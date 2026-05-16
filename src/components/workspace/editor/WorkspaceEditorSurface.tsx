import { useDroppable } from "@dnd-kit/react";
import type { CSSProperties, ReactElement, ReactNode, RefObject } from "react";
import { useMemo, useRef } from "react";
import {
    WORKSPACE_EDITOR_OPTIONS,
    WORKSPACE_EDITOR_PROPS,
    WORKSPACE_EDITOR_STYLE,
} from "../../../constants/workspace/editor";
import {
    PANE_DROP_ID_PREFIX,
    SPLIT_DROP_ID_PREFIX,
} from "../../../constants/workspace/workspace";
import { useWorkspaceAcePaneHandlers } from "../../../hooks/workspace/useWorkspaceAcePaneHandlers";
import { useWorkspaceSplitResizeHandle } from "../../../hooks/workspace/useWorkspaceSplitResizeHandle";
import { joinClassNames } from "../../../lib/shared/className";
import type {
    WorkspaceSplitNode,
    WorkspaceSplitPaneNode,
    WorkspaceSplitPlacement,
} from "../../../lib/workspace/session/sessionSplitView.type";
import { WorkspaceActionsButton } from "../actions/WorkspaceActionsButton";
import { WorkspaceTabBar } from "../WorkspaceTabBar";
import { AppCodeCompletion } from "./AppCodeCompletion";
import { WorkspaceEditorSearchPanel } from "./search/WorkspaceEditorSearchPanel";
import type {
    WorkspaceAcePaneProps,
    WorkspaceEditorSurfaceProps,
} from "./WorkspaceEditorSurface.type";

function WorkspaceAcePane({
    AceEditorComponent,
    aceRuntime,
    appTheme,
    createHandleEditorChange,
    createHandleEditorLoad,
    createHandleEditorUnmount,
    createHandleScroll,
    cursorStyle,
    editorFontSize,
    isSmoothCaretEnabled,
    isScopeHighlightingEnabled,
    isRelativeLineNumbersEnabled,
    isWordWrapEnabled,
    isTabsToSpacesEnabled,
    isActiveTab,
    isVisible,
    onActiveTabLuauChange,
    tab,
    tabSize,
}: WorkspaceAcePaneProps): ReactElement {
    const acePaneHandlers = useWorkspaceAcePaneHandlers({
        createHandleEditorChange,
        createHandleEditorLoad,
        createHandleEditorUnmount,
        createHandleScroll,
        isActiveTab,
        isRelativeLineNumbersEnabled,
        isTabsToSpacesEnabled,
        isVisible,
        onActiveTabLuauChange,
        tab,
        tabSize,
    });
    const editorOptions = {
        ...WORKSPACE_EDITOR_OPTIONS,
        animatedScroll: isSmoothCaretEnabled,
        cursorStyle,
        relativeLineNumbers: false,
        useSoftTabs: isTabsToSpacesEnabled,
    } as const;
    const editorClassName = joinClassNames(
        "workspace-ace-editor",
        isSmoothCaretEnabled && "workspace-ace-editor-smooth-caret",
        !isScopeHighlightingEnabled &&
            "workspace-ace-editor-disable-scope-highlight",
    );

    return (
        <div
            ref={acePaneHandlers.editorHostRef}
            aria-hidden={!isVisible}
            className="absolute inset-0 z-10"
        >
            <AceEditorComponent
                className={editorClassName}
                name={`workspace-editor-${tab.id}`}
                mode={aceRuntime.getMode(tab.fileName)}
                theme={aceRuntime.getTheme(appTheme)}
                width="100%"
                height="100%"
                value={tab.content}
                onLoad={acePaneHandlers.onLoad}
                onChange={acePaneHandlers.onChange}
                onScroll={acePaneHandlers.onScroll}
                onFocus={acePaneHandlers.onFocus}
                onBlur={acePaneHandlers.onBlur}
                onCursorChange={acePaneHandlers.onCursorChange}
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

type WorkspaceSplitDropZoneProps = {
    paneId: string;
    placement: WorkspaceSplitPlacement;
};

function WorkspaceSplitDropZone({
    paneId,
    placement,
}: WorkspaceSplitDropZoneProps): ReactElement {
    const { isDropTarget, ref } = useDroppable({
        id: `${SPLIT_DROP_ID_PREFIX}:${paneId}:${placement}`,
    });
    const classNameByAlignment = {
        left: "pointer-events-none absolute inset-y-0 left-0 z-30 w-1/2",
        right: "pointer-events-none absolute inset-y-0 right-0 z-30 w-1/2",
        top: "pointer-events-none absolute inset-x-0 top-0 z-30 h-1/2",
        bottom: "pointer-events-none absolute inset-x-0 bottom-0 z-30 h-1/2",
    } as const;

    return (
        <div ref={ref} className={classNameByAlignment[placement]}>
            {isDropTarget ? (
                <>
                    <div className="absolute inset-0 bg-fumi-400/10" />
                    <div className="absolute inset-2 rounded-lg border-2 border-fumi-500/40 bg-fumi-400/5" />
                </>
            ) : null}
        </div>
    );
}

type WorkspacePaneTabBarProps = {
    activeTabId: string | null;
    paneId: string;
    tabs: WorkspaceEditorSurfaceProps["pane"]["tabs"];
    pane: WorkspaceEditorSurfaceProps["pane"];
    splitViewState: WorkspaceEditorSurfaceProps["splitViewState"];
};

function WorkspacePaneTabBar({
    activeTabId,
    paneId,
    tabs,
    pane,
    splitViewState,
}: WorkspacePaneTabBarProps): ReactElement | null {
    const { isDropTarget, ref } = useDroppable({
        id: `${PANE_DROP_ID_PREFIX}:${paneId}`,
    });
    const screenTabs = tabs.map((tab) => ({
        fileName: tab.fileName,
        id: tab.id,
        isDirty: tab.content !== tab.savedContent,
        isPinned: tab.isPinned === true,
    }));

    if (tabs.length === 0) {
        return null;
    }

    return (
        <div
            ref={ref}
            className={joinClassNames(
                "relative shrink-0",
                isDropTarget && "ring-2 ring-inset ring-fumi-500/35",
            )}
        >
            <WorkspaceTabBar
                workspace={{
                    ...pane.tabBar.workspaceBase,
                    activeTabId,
                    tabs: screenTabs,
                    splitView: splitViewState.splitView,
                }}
                splitView={splitViewState.splitView}
                tabListScopeId={paneId}
                renameState={pane.tabBar.renameState}
                previewTabs={screenTabs}
                isTabDragActive={pane.tabBar.isTabDragActive}
                splitDropTarget={null}
                onCreateFile={pane.tabBar.onCreateFile}
                onSelectTab={pane.onSelectTab}
                onDuplicateTab={pane.tabBar.onDuplicateTab}
                onArchiveTab={pane.tabBar.onArchiveTab}
                onArchiveAllTabs={pane.tabBar.onArchiveAllTabs}
                onArchiveOtherTabs={pane.tabBar.onArchiveOtherTabs}
                onToggleTabPinned={pane.tabBar.onToggleTabPinned}
                onDeleteTab={pane.tabBar.onDeleteTab}
                onSplitTab={pane.tabBar.onSplitTab}
                onCloseSplitView={pane.tabBar.onCloseSplitView}
                middleClickTabAction={pane.tabBar.middleClickTabAction}
                isSplitViewArchiveScopeEnabled={
                    pane.tabBar.isSplitViewArchiveScopeEnabled
                }
            />
        </div>
    );
}

type WorkspaceSplitPaneProps = {
    node: WorkspaceSplitPaneNode;
    shouldShowTabBar: boolean;
    tabById: ReadonlyMap<
        string,
        WorkspaceEditorSurfaceProps["pane"]["tabs"][number]
    >;
    pane: WorkspaceEditorSurfaceProps["pane"];
    completion: WorkspaceEditorSurfaceProps["completion"];
    outline: WorkspaceEditorSurfaceProps["outline"];
    surface: WorkspaceEditorSurfaceProps["surface"];
    splitViewState: WorkspaceEditorSurfaceProps["splitViewState"];
};

function WorkspaceSplitPane({
    node,
    shouldShowTabBar,
    tabById,
    pane,
    completion,
    outline,
    surface,
    splitViewState,
}: WorkspaceSplitPaneProps): ReactElement {
    const {
        AceEditorComponent,
        aceRuntime,
        tabs: workspaceTabs,
    } = surface.state;
    const paneTabs = node.tabIds.reduce<(typeof workspaceTabs)[number][]>(
        (tabs, tabId) => {
            const tab = tabById.get(tabId);

            if (tab) {
                tabs.push(tab);
            }

            return tabs;
        },
        [],
    );
    const activeTab =
        (node.activeTabId ? tabById.get(node.activeTabId) : undefined) ??
        paneTabs[0] ??
        null;

    return (
        <div
            className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-fumi-200 bg-fumi-50"
            onPointerDown={() => {
                splitViewState.onFocusPane(node.id);
            }}
        >
            {shouldShowTabBar ? (
                <WorkspacePaneTabBar
                    activeTabId={activeTab?.id ?? null}
                    paneId={node.id}
                    tabs={paneTabs}
                    pane={pane}
                    splitViewState={splitViewState}
                />
            ) : null}
            <div className="relative min-h-0 min-w-0 flex-1">
                {AceEditorComponent && aceRuntime && activeTab ? (
                    <WorkspaceAcePane
                        AceEditorComponent={AceEditorComponent}
                        aceRuntime={aceRuntime}
                        appTheme={pane.appTheme}
                        createHandleEditorChange={
                            completion.createHandleEditorChange
                        }
                        createHandleEditorLoad={
                            completion.createHandleEditorLoad
                        }
                        createHandleEditorUnmount={
                            completion.createHandleEditorUnmount
                        }
                        createHandleScroll={completion.createHandleScroll}
                        cursorStyle={pane.cursorStyle}
                        editorFontSize={pane.editorFontSize}
                        isSmoothCaretEnabled={pane.isSmoothCaretEnabled}
                        isScopeHighlightingEnabled={
                            pane.isScopeHighlightingEnabled
                        }
                        isRelativeLineNumbersEnabled={
                            pane.isRelativeLineNumbersEnabled
                        }
                        isWordWrapEnabled={pane.isWordWrapEnabled}
                        isTabsToSpacesEnabled={pane.isTabsToSpacesEnabled}
                        isActiveTab={activeTab.id === pane.activeTabId}
                        isVisible
                        onActiveTabLuauChange={outline.onActiveTabLuauChange}
                        tab={activeTab}
                        tabSize={pane.tabSize}
                    />
                ) : null}
                <WorkspaceSplitDropZone paneId={node.id} placement="left" />
                <WorkspaceSplitDropZone paneId={node.id} placement="right" />
                <WorkspaceSplitDropZone paneId={node.id} placement="top" />
                <WorkspaceSplitDropZone paneId={node.id} placement="bottom" />
            </div>
        </div>
    );
}

type WorkspaceSplitTreeProps = {
    node: WorkspaceSplitNode;
    tabById: ReadonlyMap<
        string,
        WorkspaceEditorSurfaceProps["pane"]["tabs"][number]
    >;
    pane: WorkspaceEditorSurfaceProps["pane"];
    completion: WorkspaceEditorSurfaceProps["completion"];
    outline: WorkspaceEditorSurfaceProps["outline"];
    surface: WorkspaceEditorSurfaceProps["surface"];
    splitViewState: WorkspaceEditorSurfaceProps["splitViewState"];
};

type WorkspaceSplitResizeHandleProps = {
    dividerIndex: number;
    node: Extract<WorkspaceSplitNode, { type: "split" }>;
    splitViewState: WorkspaceEditorSurfaceProps["splitViewState"];
    containerRef: RefObject<HTMLDivElement | null>;
};

function WorkspaceSplitResizeHandle({
    dividerIndex,
    node,
    splitViewState,
    containerRef,
}: WorkspaceSplitResizeHandleProps): ReactElement {
    const offsetPercent =
        node.ratios
            .slice(0, dividerIndex + 1)
            .reduce((sum, ratio) => sum + ratio, 0) * 100;
    const isHorizontal = node.direction === "horizontal";
    const style = isHorizontal
        ? ({ left: `${offsetPercent}%` } satisfies CSSProperties)
        : ({ top: `${offsetPercent}%` } satisfies CSSProperties);
    const className = isHorizontal
        ? "absolute inset-y-0 z-40 w-3 -translate-x-1/2 cursor-col-resize touch-none bg-transparent focus-visible:outline-none"
        : "absolute inset-x-0 z-40 h-3 -translate-y-1/2 cursor-row-resize touch-none bg-transparent focus-visible:outline-none";
    const markerClassName = isHorizontal
        ? "absolute inset-y-0 left-1/2 w-[1px] -translate-x-1/2 bg-fumi-200"
        : "absolute left-0 top-1/2 h-[1px] w-full -translate-y-1/2 bg-fumi-200";
    const handlePointerDown = useWorkspaceSplitResizeHandle({
        containerRef,
        dividerIndex,
        isHorizontal,
        node,
        splitViewState,
    });

    return (
        <button
            type="button"
            aria-label="Resize split view"
            className={className}
            style={style}
            onPointerDown={handlePointerDown}
        >
            <span className={markerClassName} />
        </button>
    );
}

function WorkspaceSplitTree({
    node,
    tabById,
    pane,
    completion,
    outline,
    surface,
    splitViewState,
}: WorkspaceSplitTreeProps): ReactElement {
    const containerRef = useRef<HTMLDivElement | null>(null);

    if (node.type === "pane") {
        return (
            <WorkspaceSplitPane
                node={node}
                shouldShowTabBar
                tabById={tabById}
                pane={pane}
                completion={completion}
                outline={outline}
                surface={surface}
                splitViewState={splitViewState}
            />
        );
    }

    const className =
        node.direction === "horizontal"
            ? "relative flex min-h-0 min-w-0 flex-1 overflow-hidden"
            : "relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden";
    const children: ReactNode[] = [];

    node.children.forEach((child, index) => {
        const ratio = node.ratios[index] ?? 1 / node.children.length;
        const style = {
            flexBasis: `${ratio * 100}%`,
            flexGrow: 1,
            flexShrink: 1,
        } satisfies CSSProperties;

        children.push(
            <div
                key={child.id}
                className="flex min-h-0 min-w-0 overflow-hidden"
                style={style}
            >
                <WorkspaceSplitTree
                    node={child}
                    tabById={tabById}
                    pane={pane}
                    completion={completion}
                    outline={outline}
                    surface={surface}
                    splitViewState={splitViewState}
                />
            </div>,
        );

        if (index < node.children.length - 1) {
            const nextChild = node.children[index + 1];

            children.push(
                <WorkspaceSplitResizeHandle
                    key={`${node.id}:resize:${child.id}:${nextChild?.id ?? "end"}`}
                    dividerIndex={index}
                    node={node}
                    splitViewState={splitViewState}
                    containerRef={containerRef}
                />,
            );
        }
    });

    return (
        <div ref={containerRef} className={className}>
            {children}
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
    const { acceptCompletion, completionPopup, handleCompletionHover } =
        completion;
    const { onActiveTabLuauChange } = outline;
    const { searchPanel, workspaceActionsButton } = pane;
    const { splitView } = splitViewState;
    const { editorContainerRef } = surface.refs;
    const {
        editorSurfaceStyle,
        isAceReady,
        tabs,
        workspaceActionsClassName,
        workspaceActionsStyle,
    } = surface.state;
    const tabById = useMemo(
        () => new Map(tabs.map((tab) => [tab.id, tab] as const)),
        [tabs],
    );

    return (
        <div
            ref={editorContainerRef}
            className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden transition-[padding] duration-300 ease-in-out"
            style={editorSurfaceStyle}
        >
            {!isAceReady ? (
                <div className="flex h-full w-full items-center justify-center bg-fumi-50 text-xs font-semibold uppercase tracking-[0.16em] text-fumi-400">
                    Loading editor
                </div>
            ) : null}

            {splitView?.root ? (
                <WorkspaceSplitTree
                    node={splitView.root}
                    tabById={tabById}
                    pane={pane}
                    completion={completion}
                    outline={outline}
                    surface={surface}
                    splitViewState={splitViewState}
                />
            ) : (
                <WorkspaceSplitPane
                    node={{
                        type: "pane",
                        id: "pane-root",
                        activeTabId: pane.activeTabId,
                        tabIds: tabs.map((tab) => tab.id),
                    }}
                    shouldShowTabBar={false}
                    tabById={tabById}
                    pane={pane}
                    completion={completion}
                    outline={{ onActiveTabLuauChange }}
                    surface={surface}
                    splitViewState={splitViewState}
                />
            )}
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
