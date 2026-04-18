import {
    ArrowDown01Icon,
    CollapseIcon,
    ExpandIcon,
} from "@hugeicons/core-free-icons";
import { useVirtualizer } from "@tanstack/react-virtual";
import { memo, type ReactElement, useMemo, useRef } from "react";
import {
    WORKSPACE_OUTLINE_VIRTUAL_GROUP_HEIGHT,
    WORKSPACE_OUTLINE_VIRTUAL_ITEM_HEIGHT,
    WORKSPACE_OUTLINE_VIRTUAL_OVERSCAN,
} from "../../constants/workspace/outline";
import type { LuauFileSymbol } from "../../lib/luau/luau.type";
import { searchWorkspaceOutlineGroups } from "../../lib/workspace/outlineSearch";
import { AppIcon } from "../app/AppIcon";
import { AppSearchField } from "../app/AppSearchField";
import { AppTooltip } from "../app/AppTooltip";
import type {
    OutlineEntry,
    WorkspaceOutlinePanelProps,
} from "./workspaceOutlinePanel.type";

function getSymbolIcon(kind: LuauFileSymbol["kind"]): string {
    switch (kind) {
        case "function":
            return "ƒ";
        case "constant":
            return "C";
        case "datatype":
            return "D";
        case "enum":
            return "E";
        case "keyword":
            return "K";
        case "library":
            return "L";
        case "namespace":
            return "N";
        case "service":
            return "S";
        default:
            return "•";
    }
}

function getSymbolColor(kind: LuauFileSymbol["kind"]): string {
    switch (kind) {
        case "function":
            return "text-fumi-700";
        case "constant":
            return "text-fumi-500";
        default:
            return "text-fumi-600";
    }
}

const OutlineSymbolRow = memo(function OutlineSymbolRow({
    symbol,
    onSelectSymbol,
}: {
    onSelectSymbol: (symbol: LuauFileSymbol) => void;
    symbol: LuauFileSymbol;
}): ReactElement {
    const iconColor = getSymbolColor(symbol.kind);
    const icon = getSymbolIcon(symbol.kind);

    return (
        <button
            type="button"
            className="group flex h-[26px] w-full items-center gap-2 rounded px-2 py-1 text-left text-xs transition-colors duration-150 ease-out hover:bg-fumi-100 focus-visible:bg-fumi-100 focus-visible:outline-none"
            onClick={() => {
                onSelectSymbol(symbol);
            }}
        >
            <span
                className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded text-[10px] font-bold ${iconColor}`}
            >
                {icon}
            </span>
            <span className="min-w-0 flex-1 truncate font-mono text-fumi-800">
                {symbol.label}
            </span>
            {symbol.detail ? (
                <span className="flex-shrink-0 text-[10px] text-fumi-500">
                    {symbol.detail}
                </span>
            ) : null}
        </button>
    );
});

const OutlineGroupRow = memo(function OutlineGroupRow({
    count,
    isExpanded,
    onToggle,
    title,
}: {
    count: number;
    isExpanded: boolean;
    onToggle: () => void;
    title: string;
}): ReactElement {
    return (
        <button
            type="button"
            className="flex h-[30px] w-full items-center gap-1 px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-fumi-500 transition-colors duration-150 ease-out hover:text-fumi-700 focus-visible:outline-none"
            onClick={onToggle}
        >
            <AppIcon
                icon={ArrowDown01Icon}
                size={10}
                strokeWidth={2.5}
                className={`transition-transform duration-200 ${isExpanded ? "" : "-rotate-90"}`}
            />
            <span>{title}</span>
            <span className="ml-auto text-fumi-400">{count}</span>
        </button>
    );
});

/**
 * The outline panel showing Luau symbols (functions, constants, etc).
 *
 * @param props - Component props
 * @param props.symbols - Luau file symbols to display
 * @param props.onSelectSymbol - Called when a symbol is selected
 * @param props.expandedGroups - Map of expanded group titles
 * @param props.onToggleExpandedGroup - Toggle a group's expanded state
 * @param props.outlineSearchQuery - Current filter query
 * @param props.onOutlineSearchQueryChange - Called when filter changes
 * @returns A React component
 */
export const WorkspaceOutlinePanel = memo(function WorkspaceOutlinePanel({
    symbols,
    onSelectSymbol,
    expandedGroups,
    onToggleExpandedGroup,
    onExpandAllGroups,
    onCollapseAllGroups,
    outlineSearchQuery,
    onOutlineSearchQueryChange,
}: WorkspaceOutlinePanelProps): ReactElement {
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const searchRef = useRef<HTMLInputElement | null>(null);

    const filteredGroups = useMemo(() => {
        return searchWorkspaceOutlineGroups(symbols, outlineSearchQuery);
    }, [outlineSearchQuery, symbols]);

    const groupTitles = useMemo(
        () => filteredGroups.map((g) => g.title),
        [filteredGroups],
    );

    const entries = useMemo<OutlineEntry[]>(() => {
        const result: OutlineEntry[] = [];

        for (const group of filteredGroups) {
            result.push({
                id: `group-${group.title}`,
                count: group.symbols.length,
                title: group.title,
                type: "group",
            });

            if (!expandedGroups[group.title]) {
                continue;
            }

            for (const symbol of group.symbols) {
                result.push({
                    id: `symbol-${symbol.kind}-${symbol.label}-${symbol.declarationStart}`,
                    symbol,
                    title: group.title,
                    type: "symbol",
                });
            }
        }

        return result;
    }, [expandedGroups, filteredGroups]);

    const virtualizerOptions = useMemo(
        () => ({
            count: entries.length,
            estimateSize: (index: number) => {
                const entry = entries[index];
                return entry?.type === "group"
                    ? WORKSPACE_OUTLINE_VIRTUAL_GROUP_HEIGHT
                    : WORKSPACE_OUTLINE_VIRTUAL_ITEM_HEIGHT;
            },
            getScrollElement: () => scrollRef.current,
            overscan: WORKSPACE_OUTLINE_VIRTUAL_OVERSCAN,
        }),
        [entries],
    );
    const rowVirtualizer = useVirtualizer(virtualizerOptions);

    const isQueryActive = outlineSearchQuery.trim().length > 0;

    return (
        <aside className="flex h-full w-full min-w-0 flex-col bg-fumi-50 transition-colors duration-200">
            <div className="flex items-center gap-2 border-b border-fumi-200 px-3 py-2">
                <AppSearchField
                    inputRef={searchRef}
                    className="flex-1"
                    value={outlineSearchQuery}
                    onChange={onOutlineSearchQueryChange}
                    isClearable
                    placeholder="Filter symbols"
                    ariaLabel="Filter symbols in outline"
                    inputClassName="h-7 w-full min-w-0 rounded-[0.45rem] border border-fumi-200 bg-fumi-100 px-2 text-[11px] font-medium text-fumi-800 placeholder:text-fumi-400 outline-none transition-[border-color,box-shadow] focus:border-fumi-600 focus:bg-fumi-50 focus:ring-1 focus:ring-fumi-600"
                    clearButtonClassName="absolute right-1.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-fumi-400 transition-colors hover:text-fumi-700 focus-visible:outline-none"
                />
                <div className="flex shrink-0 items-center gap-0.5">
                    <AppTooltip content="Expand all" side="top">
                        <button
                            type="button"
                            className="flex h-6 w-6 items-center justify-center rounded text-fumi-500 transition-colors duration-150 ease-out hover:bg-fumi-100 hover:text-fumi-700 focus-visible:bg-fumi-100 focus-visible:outline-none"
                            aria-label="Expand all groups"
                            onClick={() => {
                                onExpandAllGroups(groupTitles);
                            }}
                        >
                            <AppIcon
                                icon={ExpandIcon}
                                size={14}
                                strokeWidth={2.5}
                            />
                        </button>
                    </AppTooltip>
                    <AppTooltip content="Collapse all" side="top">
                        <button
                            type="button"
                            className="flex h-6 w-6 items-center justify-center rounded text-fumi-500 transition-colors duration-150 ease-out hover:bg-fumi-100 hover:text-fumi-700 focus-visible:bg-fumi-100 focus-visible:outline-none"
                            aria-label="Collapse all groups"
                            onClick={() => {
                                onCollapseAllGroups(groupTitles);
                            }}
                        >
                            <AppIcon
                                icon={CollapseIcon}
                                size={14}
                                strokeWidth={2.5}
                            />
                        </button>
                    </AppTooltip>
                </div>
            </div>
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto scroll-smooth py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {entries.length > 0 ? (
                    <div
                        className="relative w-full"
                        style={{
                            height: `${rowVirtualizer.getTotalSize()}px`,
                        }}
                    >
                        {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                            const entry = entries[virtualItem.index];

                            if (!entry) {
                                return null;
                            }

                            return (
                                <div
                                    key={entry.id}
                                    data-index={virtualItem.index}
                                    className="absolute left-0 top-0 w-full px-2"
                                    ref={rowVirtualizer.measureElement}
                                    style={{
                                        height: `${virtualItem.size}px`,
                                        transform: `translateY(${virtualItem.start}px)`,
                                    }}
                                >
                                    {entry.type === "group" ? (
                                        <OutlineGroupRow
                                            count={entry.count}
                                            isExpanded={
                                                expandedGroups[entry.title] ??
                                                true
                                            }
                                            onToggle={() => {
                                                onToggleExpandedGroup(
                                                    entry.title,
                                                );
                                            }}
                                            title={entry.title}
                                        />
                                    ) : (
                                        <OutlineSymbolRow
                                            symbol={entry.symbol}
                                            onSelectSymbol={onSelectSymbol}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex h-full items-center justify-center px-4 text-center">
                        <p className="text-xs text-fumi-400">
                            {isQueryActive
                                ? `No symbols matching "${outlineSearchQuery.trim()}"`
                                : "No symbols found in this file"}
                        </p>
                    </div>
                )}
            </div>
        </aside>
    );
});
