import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import type { ReactElement } from "react";
import { APP_TEXT_INPUT_PROPS } from "../../constants/app/input";
import { AppIcon } from "../app/AppIcon";
import { AppTooltip } from "../app/AppTooltip";
import type { WorkspaceEditorSearchReplaceControlsProps } from "./workspaceEditorSearchPanel.type";

export function WorkspaceEditorSearchReplaceControls({
    isReplaceDropdownOpen,
    replaceDropdownRef,
    searchPanel,
    onReplaceChange,
    onReplaceKeyDown,
    onReplaceAll,
    onToggleReplaceDropdown,
}: WorkspaceEditorSearchReplaceControlsProps): ReactElement {
    return (
        <div className="mt-1 flex items-center gap-1.5 motion-safe:motion-opacity-in-0 motion-safe:-motion-translate-y-in-[10%] motion-safe:motion-duration-[140ms] motion-safe:motion-ease-out-cubic">
            <div className="w-7 shrink-0" />
            <div className="relative min-w-0 flex-1">
                <input
                    type="text"
                    value={searchPanel.state.replaceValue}
                    placeholder="Replace"
                    aria-label="Replace in editor"
                    onChange={onReplaceChange}
                    onKeyDown={onReplaceKeyDown}
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
                            onMouseDown={(event) => {
                                event.preventDefault();
                            }}
                            onClick={searchPanel.onReplaceNext}
                            disabled={!searchPanel.canSearch}
                            className={`app-select-none inline-flex items-center justify-center rounded-l-[0.5rem] px-2 text-[10px] font-semibold transition-[background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 disabled:cursor-not-allowed ${
                                searchPanel.canSearch ? "hover:bg-fumi-700" : ""
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
                            onClick={onToggleReplaceDropdown}
                            disabled={!searchPanel.canSearch}
                            className={`app-select-none inline-flex w-5 shrink-0 items-center justify-center rounded-r-[0.5rem] transition-[background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 disabled:cursor-not-allowed ${
                                searchPanel.canSearch ? "hover:bg-fumi-700" : ""
                            }`}
                        >
                            <AppIcon
                                icon={ArrowDown01Icon}
                                size={12}
                                strokeWidth={2.5}
                                className={`transition-transform duration-200 ${
                                    isReplaceDropdownOpen ? "rotate-180" : ""
                                }`}
                            />
                        </button>
                    </AppTooltip>
                </div>

                {isReplaceDropdownOpen ? (
                    <div className="absolute right-0 top-[calc(100%+0.3rem)] z-50 w-max origin-top-right rounded-[0.45rem] border border-fumi-200 bg-fumi-50 p-0.5 shadow-[var(--shadow-app-floating)] animate-fade-in motion-safe:motion-opacity-in-0 motion-safe:motion-scale-in-[96%] motion-safe:motion-duration-150 motion-safe:motion-ease-out-cubic">
                        <button
                            type="button"
                            onClick={onReplaceAll}
                            onMouseDown={(event) => {
                                event.preventDefault();
                            }}
                            className="flex w-full items-center justify-center whitespace-nowrap rounded-[0.35rem] px-2 py-1 text-[10px] font-semibold text-fumi-700 transition-[background-color,color] hover:bg-fumi-100 hover:text-fumi-900 focus-visible:outline-none focus-visible:bg-fumi-100 focus-visible:text-fumi-900"
                        >
                            Replace All
                        </button>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
