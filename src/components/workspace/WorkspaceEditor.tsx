import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import type { UseWorkspaceCodeCompletionResult } from "../../hooks/workspace/useWorkspaceCodeCompletion";
import type { LoadedAceRuntime } from "../../lib/luau/loadAceRuntime";
import { loadAceRuntime } from "../../lib/luau/loadAceRuntime";
import type { AppTheme } from "../../types/app/settings";
import type { WorkspaceTab } from "../../types/workspace/session";
import { AppCodeCompletion } from "./AppCodeCompletion";

const WORKSPACE_EDITOR_FONT_FAMILY =
    '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace';
const WORKSPACE_EDITOR_OPTIONS = {
    fontFamily: WORKSPACE_EDITOR_FONT_FAMILY,
    useWorker: false,
    displayIndentGuides: true,
    showFoldWidgets: false,
    scrollPastEnd: true,
} as const;
const WORKSPACE_EDITOR_PROPS = {
    $blockScrolling: true,
} as const;
const WORKSPACE_EDITOR_STYLE = {
    fontFamily: WORKSPACE_EDITOR_FONT_FAMILY,
} as const;

type AceEditorComponent = typeof import("react-ace").default;

type WorkspaceEditorProps = {
    activeTabId: string;
    appTheme: AppTheme;
    editorFontSize: number;
    tabs: WorkspaceTab[];
} & Pick<
    UseWorkspaceCodeCompletionResult,
    | "acceptCompletion"
    | "completionPopup"
    | "createHandleCursorChange"
    | "createHandleEditorChange"
    | "createHandleEditorLoad"
    | "createHandleScroll"
    | "handleCompletionHover"
>;

export function WorkspaceEditor({
    activeTabId,
    appTheme,
    editorFontSize,
    tabs,
    acceptCompletion,
    completionPopup,
    createHandleCursorChange,
    createHandleEditorChange,
    createHandleEditorLoad,
    createHandleScroll,
    handleCompletionHover,
}: WorkspaceEditorProps): ReactElement {
    const [isAceReady, setIsAceReady] = useState(false);
    const [AceEditorComponent, setAceEditorComponent] =
        useState<AceEditorComponent | null>(null);
    const [aceRuntime, setAceRuntime] = useState<LoadedAceRuntime | null>(null);

    useEffect(() => {
        let isMounted = true;

        void (async () => {
            const loadedAceRuntime = await loadAceRuntime();
            const reactAceModule = await import("react-ace");

            if (isMounted) {
                setAceRuntime(loadedAceRuntime);
                setAceEditorComponent(() => reactAceModule.default);
                setIsAceReady(true);
            }
        })();

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <div className="flex min-h-0 flex-1 overflow-hidden bg-fumi-50">
            <div className="relative flex min-h-0 flex-1">
                {!isAceReady ? (
                    <div className="flex h-full w-full items-center justify-center bg-fumi-50 text-xs font-semibold uppercase tracking-[0.16em] text-fumi-400">
                        Loading editor
                    </div>
                ) : null}
                {AceEditorComponent && aceRuntime
                    ? tabs.map((tab) => {
                          const isActiveTab = tab.id === activeTabId;

                          return (
                              <div
                                  key={tab.id}
                                  aria-hidden={!isActiveTab}
                                  className={`absolute inset-0 ${
                                      isAceReady && isActiveTab
                                          ? "z-10 opacity-100"
                                          : "pointer-events-none opacity-0"
                                  }`}
                              >
                                  <AceEditorComponent
                                      className="workspace-ace-editor"
                                      name={`workspace-editor-${tab.id}`}
                                      mode={aceRuntime.getMode(tab.fileName)}
                                      theme={aceRuntime.getTheme(appTheme)}
                                      width="100%"
                                      height="100%"
                                      value={tab.content}
                                      onLoad={createHandleEditorLoad(tab.id)}
                                      onChange={createHandleEditorChange(
                                          tab.id,
                                      )}
                                      onCursorChange={createHandleCursorChange(
                                          tab.id,
                                      )}
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
            </div>
        </div>
    );
}
