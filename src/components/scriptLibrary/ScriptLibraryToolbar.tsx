import {
    Delete02Icon,
    LayoutGridIcon,
    ListViewIcon,
    Search01Icon,
    StarIcon,
} from "@hugeicons/core-free-icons";
import type { ChangeEvent, ReactElement } from "react";
import { APP_TEXT_INPUT_PROPS } from "../../constants/app/input";
import {
    SCRIPT_LIBRARY_FILTER_BUTTONS,
    SCRIPT_LIBRARY_SORT_OPTIONS,
} from "../../constants/scriptLibrary/scriptLibrary";
import { AppIcon } from "../app/AppIcon";
import { AppSelect } from "../app/AppSelect";
import { AppTooltip } from "../app/AppTooltip";
import type { ScriptLibraryToolbarProps } from "./scriptLibrary.type";

export function ScriptLibraryToolbar({
    contentMode,
    favoriteCount,
    query,
    filters,
    orderBy,
    viewFormat,
    onClearFavorites,
    onContentModeChange,
    onQueryChange,
    onToggleFilter,
    onOrderByChange,
    onViewFormatChange,
}: ScriptLibraryToolbarProps): ReactElement {
    function handleQueryChange(event: ChangeEvent<HTMLInputElement>): void {
        onQueryChange(event.target.value);
    }

    return (
        <div className="flex shrink-0 flex-col gap-3 border-b border-fumi-200 bg-fumi-100/50 p-4">
            <div className="relative flex items-center">
                <AppIcon
                    icon={Search01Icon}
                    className="absolute left-3 text-fumi-400"
                    size={16}
                    strokeWidth={2.4}
                />
                <input
                    type="text"
                    placeholder="Search for scripts..."
                    value={query}
                    onChange={handleQueryChange}
                    {...APP_TEXT_INPUT_PROPS}
                    className="script-library-search-input h-10 w-full rounded-[0.8rem] border border-fumi-200 bg-fumi-50 pl-10 pr-4 text-sm font-medium text-fumi-900 transition-[border-color,box-shadow] placeholder:text-fumi-400 focus-visible:border-fumi-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600"
                />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() =>
                            onContentModeChange(
                                contentMode === "favorites"
                                    ? "browse"
                                    : "favorites",
                            )
                        }
                        className={`app-select-none inline-flex h-8 items-center gap-1.5 rounded-[0.65rem] border px-3 text-xs font-semibold tracking-wide transition-[background-color,color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-400 ${
                            contentMode === "favorites"
                                ? "border-transparent bg-fumi-600 text-fumi-50 hover:bg-fumi-500"
                                : "border-fumi-200 bg-fumi-50 text-fumi-500 hover:bg-fumi-200 hover:text-fumi-700"
                        }`}
                    >
                        <AppIcon icon={StarIcon} size={12} strokeWidth={2.5} />
                        Favorites
                        <span
                            className={`inline-flex min-w-[1.15rem] items-center justify-center rounded-full px-1 py-0.5 text-[10px] font-semibold ${
                                contentMode === "favorites"
                                    ? "bg-fumi-50/20 text-fumi-50"
                                    : "bg-fumi-100 text-fumi-700"
                            }`}
                        >
                            {favoriteCount}
                        </span>
                    </button>

                    <div className="mx-1 h-5 w-px bg-fumi-200" />

                    {SCRIPT_LIBRARY_FILTER_BUTTONS.map(
                        ({ key, label, icon }) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => onToggleFilter(key)}
                                className={`app-select-none inline-flex h-8 items-center gap-1.5 rounded-[0.65rem] border px-3 text-xs font-semibold tracking-wide transition-[background-color,color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 ${
                                    filters[key]
                                        ? "border-transparent bg-fumi-600 text-white"
                                        : "border-fumi-200 bg-fumi-50 text-fumi-500 hover:bg-fumi-200 hover:text-fumi-600"
                                }`}
                            >
                                <AppIcon
                                    icon={icon}
                                    size={12}
                                    strokeWidth={2.5}
                                />
                                {label}
                            </button>
                        ),
                    )}
                    <AppSelect
                        value={orderBy}
                        onChange={onOrderByChange}
                        options={SCRIPT_LIBRARY_SORT_OPTIONS}
                    />

                    {contentMode === "favorites" && favoriteCount > 0 ? (
                        <button
                            type="button"
                            onClick={onClearFavorites}
                            className="app-select-none inline-flex h-8 items-center gap-1.5 rounded-[0.65rem] border border-fumi-200 bg-fumi-50 px-3 text-xs font-semibold text-fumi-500 transition-colors hover:bg-fumi-100 hover:text-fumi-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-400"
                        >
                            <AppIcon
                                icon={Delete02Icon}
                                size={12}
                                strokeWidth={2.5}
                            />
                            Clear Favorites
                        </button>
                    ) : null}
                </div>

                <div className="flex shrink-0 items-center gap-1 rounded-[0.65rem] bg-fumi-200/50 p-1">
                    <AppTooltip content="Grid view">
                        <button
                            type="button"
                            aria-label="Grid view"
                            onClick={() => onViewFormatChange("grid")}
                            className={`app-select-none flex size-6 items-center justify-center rounded-[0.4rem] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 ${
                                viewFormat === "grid"
                                    ? "bg-fumi-50 text-fumi-800 shadow-sm"
                                    : "text-fumi-500 hover:bg-fumi-50 hover:text-fumi-800"
                            }`}
                        >
                            <AppIcon
                                icon={LayoutGridIcon}
                                size={14}
                                strokeWidth={2.5}
                            />
                        </button>
                    </AppTooltip>
                    <AppTooltip content="List view">
                        <button
                            type="button"
                            aria-label="List view"
                            onClick={() => onViewFormatChange("list")}
                            className={`app-select-none flex size-6 items-center justify-center rounded-[0.4rem] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 ${
                                viewFormat === "list"
                                    ? "bg-fumi-50 text-fumi-800 shadow-sm"
                                    : "text-fumi-500 hover:bg-fumi-50 hover:text-fumi-800"
                            }`}
                        >
                            <AppIcon
                                icon={ListViewIcon}
                                size={14}
                                strokeWidth={2.5}
                            />
                        </button>
                    </AppTooltip>
                </div>
            </div>
        </div>
    );
}
