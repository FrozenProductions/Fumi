import { ArrowDown01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
    memo,
    type ReactElement,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    WORKSPACE_OUTLINE_VIRTUAL_GROUP_HEIGHT,
    WORKSPACE_OUTLINE_VIRTUAL_ITEM_HEIGHT,
    WORKSPACE_OUTLINE_VIRTUAL_OVERSCAN,
} from "../../constants/workspace/outline";
import type { LuauFileSymbol } from "../../lib/luau/luau.type";
import { AppIcon } from "../app/AppIcon";
import type { WorkspaceOutlinePanelProps } from "./workspaceOutlinePanel.type";

type OutlineGroup = {
    symbols: LuauFileSymbol[];
    title: string;
};

type OutlineEntry =
    | {
          id: string;
          count: number;
          title: string;
          type: "group";
      }
    | {
          id: string;
          symbol: LuauFileSymbol;
          title: string;
          type: "symbol";
      };

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
            className="group flex h-[26px] w-full items-center gap-2 rounded px-2 py-1 text-left text-xs hover:bg-fumi-100 focus-visible:bg-fumi-100 focus-visible:outline-none"
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
            className="flex h-[30px] w-full items-center gap-1 px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-fumi-500 hover:text-fumi-700 focus-visible:outline-none"
            onClick={onToggle}
        >
            <AppIcon
                icon={isExpanded ? ArrowDown01Icon : ArrowRight01Icon}
                size={10}
                strokeWidth={2.5}
            />
            <span>{title}</span>
            <span className="ml-auto text-fumi-400">{count}</span>
        </button>
    );
});

export const WorkspaceOutlinePanel = memo(function WorkspaceOutlinePanel({
    symbols,
    onSelectSymbol,
}: WorkspaceOutlinePanelProps): ReactElement {
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const groups = useMemo<OutlineGroup[]>(() => {
        const functions: LuauFileSymbol[] = [];
        const locals: LuauFileSymbol[] = [];
        const globals: LuauFileSymbol[] = [];

        for (const symbol of symbols) {
            if (symbol.kind === "function" || symbol.kind === "namespace") {
                functions.push(symbol);
            } else if (symbol.isLexical) {
                locals.push(symbol);
            } else {
                globals.push(symbol);
            }
        }

        const result: OutlineGroup[] = [];

        if (functions.length > 0) {
            result.push({ title: "Functions", symbols: functions });
        }

        if (locals.length > 0) {
            result.push({ title: "Locals", symbols: locals });
        }

        if (globals.length > 0) {
            result.push({ title: "Globals", symbols: globals });
        }

        return result;
    }, [symbols]);
    const [expandedGroups, setExpandedGroups] = useState<
        Record<string, boolean>
    >({});

    useEffect(() => {
        setExpandedGroups((currentState) =>
            Object.fromEntries(
                groups.map((group) => [
                    group.title,
                    currentState[group.title] ?? true,
                ]),
            ),
        );
    }, [groups]);

    const entries = useMemo<OutlineEntry[]>(() => {
        const result: OutlineEntry[] = [];

        for (const group of groups) {
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
    }, [expandedGroups, groups]);

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
        [entries.length, entries],
    );
    const rowVirtualizer = useVirtualizer(virtualizerOptions);

    return (
        <aside className="flex h-full w-full min-w-0 flex-col bg-fumi-50">
            <div className="flex items-center justify-between gap-3 border-b border-fumi-200 px-3 py-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-fumi-600">
                    Outline panel
                </h2>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto py-2">
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
                                                setExpandedGroups(
                                                    (currentState) => ({
                                                        ...currentState,
                                                        [entry.title]: !(
                                                            currentState[
                                                                entry.title
                                                            ] ?? true
                                                        ),
                                                    }),
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
                            No symbols found in this file
                        </p>
                    </div>
                )}
            </div>
        </aside>
    );
});
