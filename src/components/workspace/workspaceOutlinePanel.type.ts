import type { LuauFileSymbol } from "../../lib/luau/luau.type";

export type WorkspaceOutlinePanelProps = {
    symbols: LuauFileSymbol[];
    onSelectSymbol: (symbol: LuauFileSymbol) => void;
    expandedGroups: Record<string, boolean>;
    onToggleExpandedGroup: (title: string) => void;
};
