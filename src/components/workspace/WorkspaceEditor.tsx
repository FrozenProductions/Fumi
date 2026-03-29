import type { ReactElement } from "react";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/mode-lua";
import "ace-builds/src-noconflict/mode-text";
import "ace-builds/src-noconflict/theme-github_dark";
import "ace-builds/src-noconflict/theme-github_light_default";
import type { UseWorkspaceCodeCompletionResult } from "../../hooks/workspace/useWorkspaceCodeCompletion";
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
    activeEditorMode: string;
    activeTab: WorkspaceTab;
    appTheme: AppTheme;
    editorFontSize: number;
} & Pick<
    UseWorkspaceCodeCompletionResult,
    | "acceptCompletion"
    | "completionPopup"
    | "handleCompletionHover"
    | "handleCursorChange"
    | "handleEditorChange"
    | "handleEditorLoad"
    | "handleScroll"
>;

export function WorkspaceEditor({
    activeEditorMode,
    activeTab,
    appTheme,
    editorFontSize,
    acceptCompletion,
    completionPopup,
    handleCompletionHover,
    handleCursorChange,
    handleEditorChange,
    handleEditorLoad,
    handleScroll,
}: WorkspaceEditorProps): ReactElement {
    return (
        <div className="flex min-h-0 flex-1 overflow-hidden bg-fumi-50">
            <div className="relative flex min-h-0 flex-1">
                <AceEditor
                    key={activeTab.id}
                    className="workspace-ace-editor"
                    name={`workspace-editor-${activeTab.id}`}
                    mode={activeEditorMode}
                    theme={
                        appTheme === "dark"
                            ? "github_dark"
                            : "github_light_default"
                    }
                    width="100%"
                    height="100%"
                    value={activeTab.content}
                    onBeforeLoad={configureLuauAce}
                    onLoad={handleEditorLoad}
                    onChange={handleEditorChange}
                    onCursorChange={handleCursorChange}
                    onScroll={handleScroll}
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
