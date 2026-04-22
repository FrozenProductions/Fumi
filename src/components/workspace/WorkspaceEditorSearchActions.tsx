import { ArrowDown01Icon, ArrowUp01Icon } from "@hugeicons/core-free-icons";
import type { ReactElement } from "react";
import { AppIcon } from "../app/AppIcon";
import { AppTooltip } from "../app/AppTooltip";
import type { WorkspaceEditorSearchActionsProps } from "./workspaceEditorSearchPanel.type";

export function WorkspaceEditorSearchActions({
    searchPanel,
}: WorkspaceEditorSearchActionsProps): ReactElement {
    return (
        <>
            <div className="mt-1.5 flex items-center justify-end gap-2 pr-0.5">
                <div className="flex flex-wrap items-center gap-0.5">
                    <AppTooltip content="Match Case">
                        <button
                            type="button"
                            aria-pressed={searchPanel.state.isCaseSensitive}
                            onMouseDown={(event) => {
                                event.preventDefault();
                            }}
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
                            onMouseDown={(event) => {
                                event.preventDefault();
                            }}
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
                            onMouseDown={(event) => {
                                event.preventDefault();
                            }}
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
                            onMouseDown={(event) => {
                                event.preventDefault();
                            }}
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
                            onMouseDown={(event) => {
                                event.preventDefault();
                            }}
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
        </>
    );
}
