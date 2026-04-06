import {
    ArrowDown01Icon,
    ArrowRight01Icon,
    ArrowUp01Icon,
    Cancel01Icon,
} from "@hugeicons/core-free-icons";
import type {
    ChangeEvent,
    KeyboardEvent,
    ReactElement,
    MouseEvent as ReactMouseEvent,
} from "react";
import { useEffect, useRef, useState } from "react";
import { APP_TEXT_INPUT_PROPS } from "../../constants/app/input";
import { WORKSPACE_EDITOR_SEARCH_PANEL_EXIT_DURATION_MS } from "../../constants/workspace/editor";
import { usePresenceTransition } from "../../hooks/shared/usePresenceTransition";
import { AppIcon } from "../app/AppIcon";
import { AppTooltip } from "../app/AppTooltip";
import type { WorkspaceEditorSearchPanelProps } from "./workspaceEditor.type";

function preventInputBlur(event: ReactMouseEvent<HTMLButtonElement>): void {
    event.preventDefault();
}

export function WorkspaceEditorSearchPanel({
    searchPanel,
}: WorkspaceEditorSearchPanelProps): ReactElement | null {
    const [isReplaceExpanded, setIsReplaceExpanded] = useState(false);
    const [isReplaceDropdownOpen, setIsReplaceDropdownOpen] = useState(false);
    const queryInputRef = useRef<HTMLInputElement | null>(null);
    const replaceDropdownRef = useRef<HTMLDivElement>(null);
    const { focusRequestKey } = searchPanel;

    const { isPresent, isClosing } = usePresenceTransition({
        isOpen: searchPanel.state.isOpen,
        exitDurationMs: WORKSPACE_EDITOR_SEARCH_PANEL_EXIT_DURATION_MS,
    });

    useEffect(() => {
        if (!searchPanel.state.isOpen || !isPresent || focusRequestKey < 0) {
            return;
        }

        const focusQueryInput = (): void => {
            queryInputRef.current?.focus();
            queryInputRef.current?.select();
        };

        const animationFrameId = window.requestAnimationFrame(() => {
            focusQueryInput();
        });
        const timeoutId = window.setTimeout(() => {
            if (document.activeElement !== queryInputRef.current) {
                focusQueryInput();
            }
        }, 0);

        return () => {
            window.cancelAnimationFrame(animationFrameId);
            window.clearTimeout(timeoutId);
        };
    }, [focusRequestKey, isPresent, searchPanel.state.isOpen]);

    useEffect(() => {
        if (!isReplaceDropdownOpen) {
            return;
        }

        function handleClickOutside(event: MouseEvent): void {
            const target = event.target;

            if (
                target instanceof Node &&
                replaceDropdownRef.current &&
                !replaceDropdownRef.current.contains(target)
            ) {
                setIsReplaceDropdownOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isReplaceDropdownOpen]);

    const handleToggleReplaceMode = (): void => {
        setIsReplaceExpanded((current) => !current);
    };

    const handleToggleReplaceDropdown = (): void => {
        setIsReplaceDropdownOpen((current) => !current);
    };

    const handleReplaceAll = (): void => {
        searchPanel.onReplaceAll();
        setIsReplaceDropdownOpen(false);
    };

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

    return (
        <div
            className={`pointer-events-auto w-[18rem] rounded-[0.85rem] border border-fumi-200 bg-fumi-50/95 p-1.5 shadow-[var(--shadow-app-floating)] backdrop-blur motion-reduce:animate-none motion-reduce:transform-none ${panelMotionClassName}`}
        >
            {/* ROW 1: Search Input */}
            <div className="flex items-center gap-1.5">
                <AppTooltip content="Toggle replace mode">
                    <button
                        type="button"
                        onClick={handleToggleReplaceMode}
                        onMouseDown={preventInputBlur}
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
                        className="h-7 w-full rounded-[0.5rem] border border-fumi-200 bg-fumi-50 px-2 text-[11px] font-medium text-fumi-900 outline-none transition-[border-color,box-shadow] placeholder:text-fumi-400 focus:border-fumi-600 focus:ring-1 focus:ring-fumi-600"
                    />
                </div>
                <AppTooltip content="Close (Esc)">
                    <button
                        type="button"
                        aria-label="Close"
                        onMouseDown={preventInputBlur}
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

            {/* ROW 2: Replace Input (Collapsible) */}
            {isReplaceExpanded ? (
                <div className="mt-1 flex items-center gap-1.5 motion-safe:motion-opacity-in-0 motion-safe:-motion-translate-y-in-[10%] motion-safe:motion-duration-[140ms] motion-safe:motion-ease-out-cubic">
                    <div className="w-7 shrink-0" />
                    <div className="relative min-w-0 flex-1">
                        <input
                            type="text"
                            value={searchPanel.state.replaceValue}
                            placeholder="Replace"
                            aria-label="Replace in editor"
                            onChange={handleReplaceChange}
                            onKeyDown={handleReplaceKeyDown}
                            {...APP_TEXT_INPUT_PROPS}
                            className="h-7 w-full rounded-[0.5rem] border border-fumi-200 bg-fumi-50 px-2 text-[11px] font-medium text-fumi-900 outline-none transition-[border-color,box-shadow] placeholder:text-fumi-400 focus:border-fumi-600 focus:ring-1 focus:ring-fumi-600"
                        />
                    </div>
                    <div
                        className="relative inline-flex items-center"
                        ref={replaceDropdownRef}
                    >
                        <div
                            className={`flex h-7 items-stretch rounded-[0.5rem] border transition-[background-color,border-color,color] duration-150 ${
                                searchPanel.canSearch
                                    ? "border-fumi-600 bg-fumi-600 text-fumi-50"
                                    : "border-fumi-200 bg-transparent text-fumi-400 opacity-50"
                            }`}
                        >
                            <AppTooltip content="Replace selected">
                                <button
                                    type="button"
                                    onMouseDown={preventInputBlur}
                                    onClick={searchPanel.onReplaceNext}
                                    disabled={!searchPanel.canSearch}
                                    className={`app-select-none inline-flex items-center justify-center rounded-l-[0.5rem] px-2 text-[10px] font-semibold transition-[background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 disabled:cursor-not-allowed ${
                                        searchPanel.canSearch
                                            ? "hover:bg-fumi-700"
                                            : ""
                                    }`}
                                >
                                    Replace
                                </button>
                            </AppTooltip>
                            <div
                                className={`my-1 w-px transition-colors ${
                                    searchPanel.canSearch
                                        ? "bg-fumi-500"
                                        : "bg-fumi-200"
                                }`}
                            />

                            <AppTooltip content="More options">
                                <button
                                    type="button"
                                    onClick={handleToggleReplaceDropdown}
                                    disabled={!searchPanel.canSearch}
                                    className={`app-select-none inline-flex w-5 shrink-0 items-center justify-center rounded-r-[0.5rem] transition-[background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 disabled:cursor-not-allowed ${
                                        searchPanel.canSearch
                                            ? "hover:bg-fumi-700"
                                            : ""
                                    }`}
                                >
                                    <AppIcon
                                        icon={ArrowDown01Icon}
                                        size={12}
                                        strokeWidth={2.5}
                                        className={`transition-transform duration-200 ${isReplaceDropdownOpen ? "rotate-180" : ""}`}
                                    />
                                </button>
                            </AppTooltip>
                        </div>

                        {isReplaceDropdownOpen ? (
                            <div className="absolute right-0 top-[calc(100%+0.3rem)] z-50 w-max origin-top-right rounded-[0.45rem] border border-fumi-200 bg-fumi-50 p-0.5 shadow-[var(--shadow-app-floating)] animate-fade-in motion-safe:motion-opacity-in-0 motion-safe:motion-scale-in-[96%] motion-safe:motion-duration-150 motion-safe:motion-ease-out-cubic">
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleReplaceAll();
                                    }}
                                    onMouseDown={preventInputBlur}
                                    className="flex w-full items-center justify-center whitespace-nowrap rounded-[0.35rem] px-2 py-1 text-[10px] font-semibold text-fumi-700 transition-[background-color,color] hover:bg-fumi-100 hover:text-fumi-900 focus-visible:outline-none focus-visible:bg-fumi-100 focus-visible:text-fumi-900"
                                >
                                    Replace All
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>
            ) : null}

            {/* ROW 3: Modifiers and Navigation */}
            <div className="mt-1.5 flex items-center justify-end gap-2 pr-0.5">
                <div className="flex flex-wrap items-center gap-0.5">
                    <AppTooltip content="Match Case">
                        <button
                            type="button"
                            aria-pressed={searchPanel.state.isCaseSensitive}
                            onMouseDown={preventInputBlur}
                            onClick={searchPanel.onToggleCaseSensitive}
                            className={`inline-flex h-6 items-center rounded-[0.4rem] px-1.5 text-[9px] font-bold tracking-[0.06em] transition-[background-color,color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 ${
                                searchPanel.state.isCaseSensitive
                                    ? "bg-fumi-200 text-fumi-800"
                                    : "text-fumi-400 hover:bg-fumi-100 hover:text-fumi-700"
                            }`}
                        >
                            Aa
                        </button>
                    </AppTooltip>
                    <AppTooltip content="Match Whole Word">
                        <button
                            type="button"
                            aria-pressed={searchPanel.state.isWholeWord}
                            onMouseDown={preventInputBlur}
                            onClick={searchPanel.onToggleWholeWord}
                            className={`inline-flex h-6 items-center rounded-[0.4rem] px-1.5 text-[9px] font-bold tracking-[0.06em] transition-[background-color,color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 ${
                                searchPanel.state.isWholeWord
                                    ? "bg-fumi-200 text-fumi-800"
                                    : "text-fumi-400 hover:bg-fumi-100 hover:text-fumi-700"
                            }`}
                        >
                            |ab|
                        </button>
                    </AppTooltip>
                    <AppTooltip content="Use Regular Expression">
                        <button
                            type="button"
                            aria-pressed={searchPanel.state.isRegex}
                            onMouseDown={preventInputBlur}
                            onClick={searchPanel.onToggleRegex}
                            className={`inline-flex h-6 items-center rounded-[0.4rem] px-1.5 text-[9px] font-bold tracking-[0.06em] transition-[background-color,color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 ${
                                searchPanel.state.isRegex
                                    ? "bg-fumi-200 text-fumi-800"
                                    : "text-fumi-400 hover:bg-fumi-100 hover:text-fumi-700"
                            }`}
                        >
                            .*
                        </button>
                    </AppTooltip>
                </div>

                <div className="flex shrink-0 items-center gap-0.5">
                    <AppTooltip content="Previous match (Shift+Enter)">
                        <button
                            type="button"
                            onMouseDown={preventInputBlur}
                            onClick={searchPanel.onFindPrevious}
                            disabled={!searchPanel.canSearch}
                            aria-label="Previous match"
                            className="flex h-6 w-7 items-center justify-center rounded-[0.4rem] text-fumi-500 transition-[background-color,color,border-color,opacity] hover:bg-fumi-100 hover:text-fumi-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <AppIcon
                                icon={ArrowUp01Icon}
                                size={14}
                                strokeWidth={2.5}
                            />
                        </button>
                    </AppTooltip>
                    <AppTooltip content="Next match (Enter)">
                        <button
                            type="button"
                            onMouseDown={preventInputBlur}
                            onClick={searchPanel.onFindNext}
                            disabled={!searchPanel.canSearch}
                            aria-label="Next match"
                            className="flex h-6 w-7 items-center justify-center rounded-[0.4rem] text-fumi-500 transition-[background-color,color,border-color,opacity] hover:bg-fumi-100 hover:text-fumi-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <AppIcon
                                icon={ArrowDown01Icon}
                                size={14}
                                strokeWidth={2.5}
                            />
                        </button>
                    </AppTooltip>
                </div>
            </div>

            {searchPanel.validationError ? (
                <div className="mt-1 pl-[2.25rem]">
                    <div className="truncate text-[9px] font-bold uppercase tracking-wider text-red-600">
                        {searchPanel.validationError}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
