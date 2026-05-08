import type {
    LuauCompletionItem,
    LuauCompletionPopupPosition,
} from "../../../lib/luau/luau.type";

export type AppCodeCompletionProps = {
    items: LuauCompletionItem[];
    selectedIndex: number;
    position: LuauCompletionPopupPosition;
    onHoverItem: (index: number) => void;
    onSelectItem: (index: number) => void;
};
