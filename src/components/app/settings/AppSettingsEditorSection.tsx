import type { ReactElement } from "react";
import {
    APP_EDITOR_CURSOR_STYLE_OPTIONS,
    APP_EDITOR_FONT_SIZE_MAX,
    APP_EDITOR_FONT_SIZE_MIN,
    APP_EDITOR_TAB_SIZE_OPTIONS,
    APP_INTELLISENSE_PRIORITY_OPTIONS,
    APP_INTELLISENSE_WIDTH_OPTIONS,
    APP_MIDDLE_CLICK_TAB_ACTION_OPTIONS,
} from "../../../constants/app/settings";
import { useAppStore } from "../../../hooks/app/useAppStore";
import type {
    AppEditorCursorStyle,
    AppEditorTabSize,
    AppMiddleClickTabAction,
} from "../../../lib/app/app.type";
import { AppInput } from "../form/AppInput";
import { AppSelect } from "../form/AppSelect";
import { AppSettingsToggle } from "../form/AppSettingsToggle";

/**
 * The editor settings section with font size, IntelliSense, and tab actions.
 *
 * @returns A React component
 */
export function AppSettingsEditorSection(): ReactElement {
    const editorSettings = useAppStore((state) => state.editorSettings);
    const setEditorFontSize = useAppStore((state) => state.setEditorFontSize);
    const setEditorCursorStyle = useAppStore(
        (state) => state.setEditorCursorStyle,
    );
    const setEditorSmoothCaretEnabled = useAppStore(
        (state) => state.setEditorSmoothCaretEnabled,
    );
    const setEditorScopeHighlightingEnabled = useAppStore(
        (state) => state.setEditorScopeHighlightingEnabled,
    );
    const setEditorWordWrapEnabled = useAppStore(
        (state) => state.setEditorWordWrapEnabled,
    );
    const setEditorTabsToSpacesEnabled = useAppStore(
        (state) => state.setEditorTabsToSpacesEnabled,
    );
    const setEditorTabSize = useAppStore((state) => state.setEditorTabSize);
    const setEditorIntellisenseEnabled = useAppStore(
        (state) => state.setEditorIntellisenseEnabled,
    );
    const setEditorIntellisensePriority = useAppStore(
        (state) => state.setEditorIntellisensePriority,
    );
    const setEditorIntellisenseWidth = useAppStore(
        (state) => state.setEditorIntellisenseWidth,
    );
    const middleClickTabAction = useAppStore(
        (state) => state.workspaceSettings.middleClickTabAction,
    );
    const setMiddleClickTabAction = useAppStore(
        (state) => state.setMiddleClickTabAction,
    );

    const handleFontSizeChange = (value: string): void => {
        setEditorFontSize(Number(value));
    };

    const handleCursorStyleChange = (value: AppEditorCursorStyle): void => {
        setEditorCursorStyle(value);
    };

    const handleSmoothCaretToggle = (): void => {
        setEditorSmoothCaretEnabled(!editorSettings.isSmoothCaretEnabled);
    };

    const handleScopeHighlightingToggle = (): void => {
        setEditorScopeHighlightingEnabled(
            !editorSettings.isScopeHighlightingEnabled,
        );
    };

    const handleIntellisenseToggle = (): void => {
        setEditorIntellisenseEnabled(!editorSettings.isIntellisenseEnabled);
    };

    const handleWordWrapToggle = (): void => {
        setEditorWordWrapEnabled(!editorSettings.isWordWrapEnabled);
    };

    const handleTabsToSpacesToggle = (): void => {
        setEditorTabsToSpacesEnabled(!editorSettings.isTabsToSpacesEnabled);
    };

    const handleTabSizeChange = (value: AppEditorTabSize): void => {
        setEditorTabSize(value);
    };

    const handleIntellisensePriorityChange = (
        value: (typeof APP_INTELLISENSE_PRIORITY_OPTIONS)[number]["value"],
    ): void => {
        setEditorIntellisensePriority(value);
    };

    const handleIntellisenseWidthChange = (
        value: (typeof APP_INTELLISENSE_WIDTH_OPTIONS)[number]["value"],
    ): void => {
        setEditorIntellisenseWidth(value);
    };

    const handleMiddleClickTabActionChange = (
        value: AppMiddleClickTabAction,
    ): void => {
        setMiddleClickTabAction(value);
    };

    return (
        <div className="flex w-full flex-col divide-y divide-fumi-200/80">
            <div className="flex items-center justify-between gap-6 py-4">
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-fumi-900">
                        Font size
                    </p>
                    <p className="mt-1 text-xs leading-[1.55] text-fumi-400">
                        Code editor text size across all workspace tabs.
                    </p>
                </div>
                <AppInput
                    value={String(editorSettings.fontSize)}
                    ariaLabel="Editor font size"
                    onChange={handleFontSizeChange}
                    minValue={APP_EDITOR_FONT_SIZE_MIN}
                    maxValue={APP_EDITOR_FONT_SIZE_MAX}
                    maxLength={2}
                    inputMode="numeric"
                    suffix="px"
                    className="shrink-0"
                />
            </div>
            <div className="flex items-center justify-between gap-6 py-4">
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-fumi-900">
                        Cursor style
                    </p>
                    <p className="mt-1 text-xs leading-[1.55] text-fumi-400">
                        Choose the caret shape used inside code editors.
                    </p>
                </div>
                <AppSelect
                    value={editorSettings.cursorStyle}
                    options={APP_EDITOR_CURSOR_STYLE_OPTIONS}
                    onChange={handleCursorStyleChange}
                    className="shrink-0"
                />
            </div>
            <div className="flex items-center justify-between gap-6 py-4">
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-fumi-900">
                        Middle-click tab action
                    </p>
                    <p className="mt-1 text-xs leading-[1.55] text-fumi-400">
                        Choose whether middle-clicking a workspace tab archives
                        it or permanently deletes it.
                    </p>
                </div>
                <AppSelect
                    value={middleClickTabAction}
                    options={APP_MIDDLE_CLICK_TAB_ACTION_OPTIONS}
                    onChange={handleMiddleClickTabActionChange}
                    className="shrink-0"
                />
            </div>
            <AppSettingsToggle
                label="Smooth caret movement"
                description="Animate caret movement and editor scrolling while navigating code."
                isEnabled={editorSettings.isSmoothCaretEnabled}
                onChange={handleSmoothCaretToggle}
            />
            <AppSettingsToggle
                label="Scope highlighting"
                description="Outline matching Luau scope pairs such as do/end and function/end."
                isEnabled={editorSettings.isScopeHighlightingEnabled}
                onChange={handleScopeHighlightingToggle}
            />
            <AppSettingsToggle
                label="Word wrap"
                description="Wrap long lines in editor panes instead of forcing horizontal scrolling."
                isEnabled={editorSettings.isWordWrapEnabled}
                onChange={handleWordWrapToggle}
            />
            <AppSettingsToggle
                label="Transform tabs into spaces"
                description="Insert spaces when pressing Tab instead of writing tab characters."
                isEnabled={editorSettings.isTabsToSpacesEnabled}
                onChange={handleTabsToSpacesToggle}
            >
                <div className="flex items-start justify-between gap-4 rounded-[0.95rem] border border-fumi-200/80 bg-fumi-100/70 px-3.5 py-3.5">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="mt-px size-1.5 shrink-0 rounded-full bg-fumi-500" />
                            <p className="text-[11px] font-semibold tracking-[0.01em] text-fumi-800">
                                Tab Size
                            </p>
                        </div>
                        <p className="mt-1.5 text-xs leading-[1.55] text-fumi-400">
                            Choose how many spaces the editor inserts for each
                            tab stop.
                        </p>
                    </div>
                    <AppSelect
                        value={editorSettings.tabSize}
                        options={APP_EDITOR_TAB_SIZE_OPTIONS}
                        onChange={handleTabSizeChange}
                        className="mt-0.5 shrink-0"
                    />
                </div>
            </AppSettingsToggle>
            <AppSettingsToggle
                label="IntelliSense"
                description="Show Luau completion suggestions while typing."
                isEnabled={editorSettings.isIntellisenseEnabled}
                onChange={handleIntellisenseToggle}
            >
                <div className="flex items-start justify-between gap-4 rounded-[0.95rem] border border-fumi-200/80 bg-fumi-100/70 px-3.5 py-3.5">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="mt-px size-1.5 shrink-0 rounded-full bg-fumi-500" />
                            <p className="text-[11px] font-semibold tracking-[0.01em] text-fumi-800">
                                Suggestion Priority
                            </p>
                        </div>
                        <p className="mt-1.5 text-xs leading-[1.55] text-fumi-400">
                            Prefer Luau and Roblox docs, executor APIs, or keep
                            a balanced mix when suggestions overlap.
                        </p>
                    </div>
                    <AppSelect
                        value={editorSettings.intellisensePriority}
                        options={APP_INTELLISENSE_PRIORITY_OPTIONS}
                        onChange={handleIntellisensePriorityChange}
                        className="mt-0.5 shrink-0"
                    />
                </div>
                <div className="mt-3 flex items-start justify-between gap-4 rounded-[0.95rem] border border-fumi-200/80 bg-fumi-100/70 px-3.5 py-3.5">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="mt-px size-1.5 shrink-0 rounded-full bg-fumi-500" />
                            <p className="text-[11px] font-semibold tracking-[0.01em] text-fumi-800">
                                Suggestion Width
                            </p>
                        </div>
                        <p className="mt-1.5 text-xs leading-[1.55] text-fumi-400">
                            Choose a small, normal, or large popup width for
                            completion suggestions.
                        </p>
                    </div>
                    <AppSelect
                        value={editorSettings.intellisenseWidth}
                        options={APP_INTELLISENSE_WIDTH_OPTIONS}
                        onChange={handleIntellisenseWidthChange}
                        className="mt-0.5 shrink-0"
                    />
                </div>
            </AppSettingsToggle>
        </div>
    );
}
