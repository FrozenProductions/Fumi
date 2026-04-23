import type { LuauFileSymbol } from "../../../lib/luau/luau.type";

export type WorkspaceOutlinePanelProps = {
    symbols: LuauFileSymbol[];
    onSelectSymbol: (symbol: LuauFileSymbol) => void;
    expandedGroups: Record<string, boolean>;
    onToggleExpandedGroup: (title: string) => void;
    onExpandAllGroups: (titles: string[]) => void;
    onCollapseAllGroups: (titles: string[]) => void;
    outlineSearchQuery: string;
    onOutlineSearchQueryChange: (query: string) => void;
};

export type OutlineEntry =
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
