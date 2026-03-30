import type { ReactElement } from "react";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/mode-lua";
import "ace-builds/src-noconflict/mode-text";
import "ace-builds/src-noconflict/theme-github_dark";
import "ace-builds/src-noconflict/theme-github_light_default";
import type { UseWorkspaceCodeCompletionResult } from "../../hooks/workspace/useWorkspaceCodeCompletion";
import { getEditorModeForFileName } from "../../lib/luau/fileType";
import { configureLuauAce } from "../../lib/luau/registerAceLuau";
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
    return (
        <div className="flex min-h-0 flex-1 overflow-hidden bg-fumi-50">
            <div className="relative flex min-h-0 flex-1">
                {tabs.map((tab) => {
                    const isActiveTab = tab.id === activeTabId;

                    return (
                        <div
                            key={tab.id}
                            aria-hidden={!isActiveTab}
                            className={`absolute inset-0 ${
                                isActiveTab
                                    ? "z-10 opacity-100"
                                    : "pointer-events-none opacity-0"
                            }`}
                        >
                            <AceEditor
                                className="workspace-ace-editor"
                                name={`workspace-editor-${tab.id}`}
                                mode={getEditorModeForFileName(tab.fileName)}
                                theme={
                                    appTheme === "dark"
                                        ? "github_dark"
                                        : "github_light_default"
                                }
                                width="100%"
                                height="100%"
                                value={tab.content}
                                onBeforeLoad={configureLuauAce}
                                onLoad={createHandleEditorLoad(tab.id)}
                                onChange={createHandleEditorChange(tab.id)}
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
                })}
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
