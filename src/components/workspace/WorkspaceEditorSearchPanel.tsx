import {
    ArrowDown01Icon,
    ArrowRight01Icon,
    Cancel01Icon,
} from "@hugeicons/core-free-icons";
import type { ChangeEvent, KeyboardEvent, ReactElement } from "react";
import { APP_TEXT_INPUT_PROPS } from "../../constants/app/input";
import { useWorkspaceEditorSearchPanel } from "../../hooks/workspace/useWorkspaceEditorSearchPanel";
import { AppIcon } from "../app/AppIcon";
import { AppTooltip } from "../app/AppTooltip";
import { WorkspaceEditorSearchActions } from "./WorkspaceEditorSearchActions";
import { WorkspaceEditorSearchReplaceControls } from "./WorkspaceEditorSearchReplaceControls";
import type { WorkspaceEditorSearchPanelProps } from "./workspaceEditor.type";

/**
 * Floating search panel for the workspace editor with find/replace.
 *
 * @param props - Component props
 * @param props.searchPanel - Search panel state and handlers
 * @returns A React component or null
 */
export function WorkspaceEditorSearchPanel({
    searchPanel,
}: WorkspaceEditorSearchPanelProps): ReactElement | null {
    const workspaceEditorSearchPanel =
        useWorkspaceEditorSearchPanel(searchPanel);
    const { queryInputRef, replaceDropdownRef } =
        workspaceEditorSearchPanel.refs;
    const { isClosing, isPresent, isReplaceDropdownOpen, isReplaceExpanded } =
        workspaceEditorSearchPanel.state;
    const { handleReplaceAll, toggleReplaceDropdown, toggleReplaceMode } =
        workspaceEditorSearchPanel.actions;

    if (!isPresent) {
        return null;
    }

    const handleQueryChange = (event: ChangeEvent<HTMLInputElement>): void => {
        searchPanel.onQueryChange(event.target.value);
    };

    const handleReplaceChange = (
        event: ChangeEvent<HTMLInputElement>,
    ): void => {
        searchPanel.onReplaceValueChange(event.target.value);
    };

    const handleQueryKeyDown = (
        event: KeyboardEvent<HTMLInputElement>,
    ): void => {
        if (event.key === "Escape") {
            event.preventDefault();
            searchPanel.onClose();
            return;
        }

        if (event.key !== "Enter") {
            return;
        }

        event.preventDefault();

        if (event.shiftKey) {
            searchPanel.onFindPrevious();
            return;
        }

        searchPanel.onFindNext();
    };

    const handleReplaceKeyDown = (
        event: KeyboardEvent<HTMLInputElement>,
    ): void => {
        if (event.key === "Escape") {
            event.preventDefault();
            searchPanel.onClose();
            return;
        }

        if (event.key !== "Enter") {
            return;
        }

        event.preventDefault();
        searchPanel.onReplaceNext();
    };

    const panelMotionClassName = isClosing
        ? "motion-safe:motion-opacity-out-0 motion-safe:motion-scale-out-[96%] motion-safe:-motion-translate-y-out-[8%] motion-safe:motion-duration-150 motion-safe:motion-ease-in-quad pointer-events-none"
        : "motion-safe:motion-opacity-in-0 motion-safe:motion-scale-in-[96%] motion-safe:-motion-translate-y-in-[10%] motion-safe:motion-duration-150 motion-safe:motion-ease-spring-snappy";
    const searchResultsLabel =
        searchPanel.state.query.length > 0 && !searchPanel.validationError
            ? `${searchPanel.state.activeMatchOrdinal}/${searchPanel.state.matchCount}`
            : null;
    const queryInputClassName = `h-7 w-full rounded-[0.5rem] border border-fumi-200 bg-fumi-50 px-2 text-[11px] font-medium leading-none text-fumi-900 outline-none transition-[border-color,box-shadow] placeholder:text-fumi-400 focus:border-fumi-600 focus:ring-1 focus:ring-fumi-600 ${
        searchResultsLabel ? "pr-9" : ""
    }`;

    return (
        <div
            className={`pointer-events-auto w-[18rem] rounded-[0.85rem] border border-fumi-200 bg-fumi-50/95 p-1.5 shadow-[var(--shadow-app-floating)] backdrop-blur motion-reduce:animate-none motion-reduce:transform-none ${panelMotionClassName}`}
        >
            <div className="flex items-center gap-1.5">
                <AppTooltip content="Toggle replace mode">
                    <button
                        type="button"
                        onClick={toggleReplaceMode}
                        onMouseDown={(event) => {
                            event.preventDefault();
                        }}
                        aria-label="Toggle replace mode"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[0.5rem] text-fumi-400 transition-[background-color,color] hover:bg-fumi-100 hover:text-fumi-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600"
                    >
                        <AppIcon
                            icon={
                                isReplaceExpanded
                                    ? ArrowDown01Icon
                                    : ArrowRight01Icon
                            }
                            size={14}
                            strokeWidth={2.5}
                        />
                    </button>
                </AppTooltip>
                <div className="relative min-w-0 flex-1">
                    <input
                        ref={queryInputRef}
                        type="text"
                        value={searchPanel.state.query}
                        placeholder="Find"
                        aria-label="Find in editor"
                        onChange={handleQueryChange}
                        onKeyDown={handleQueryKeyDown}
                        {...APP_TEXT_INPUT_PROPS}
                        className={queryInputClassName}
                    />
                    {searchResultsLabel ? (
                        <div className="pointer-events-none absolute inset-y-0 right-1 flex items-center">
                            <div className="text-[10px] font-semibold leading-none tabular-nums text-fumi-400">
                                {searchResultsLabel}
                            </div>
                        </div>
                    ) : null}
                </div>
                <AppTooltip content="Close (Esc)">
                    <button
                        type="button"
                        aria-label="Close"
                        onMouseDown={(event) => {
                            event.preventDefault();
                        }}
                        onClick={searchPanel.onClose}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[0.5rem] text-fumi-400 transition-[background-color,color] hover:bg-fumi-100 hover:text-fumi-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600"
                    >
                        <AppIcon
                            icon={Cancel01Icon}
                            size={14}
                            strokeWidth={2.5}
                        />
                    </button>
                </AppTooltip>
            </div>

            {isReplaceExpanded ? (
                <WorkspaceEditorSearchReplaceControls
                    isReplaceDropdownOpen={isReplaceDropdownOpen}
                    replaceDropdownRef={replaceDropdownRef}
                    searchPanel={searchPanel}
                    onReplaceChange={handleReplaceChange}
                    onReplaceKeyDown={handleReplaceKeyDown}
                    onReplaceAll={handleReplaceAll}
                    onToggleReplaceDropdown={toggleReplaceDropdown}
                />
            ) : null}

            <WorkspaceEditorSearchActions searchPanel={searchPanel} />
        </div>
    );
}
