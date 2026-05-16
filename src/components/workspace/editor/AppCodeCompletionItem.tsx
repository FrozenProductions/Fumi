import type { ReactElement } from "react";
import { getCompactLuauCompletionDetailLabel } from "../../../lib/luau/completion/completionPopup";
import type { AppCodeCompletionProps } from "./AppCodeCompletion.type";

type AppCodeCompletionItemProps = {
    index: number;
    isSelected: boolean;
    item: AppCodeCompletionProps["items"][number];
    onHoverItem: AppCodeCompletionProps["onHoverItem"];
    onSelectItem: AppCodeCompletionProps["onSelectItem"];
};

/**
 * Renders a single code completion item in the editor's autocomplete dropdown.
 *
 * Displays the completion label and a compact detail badge (e.g., "function", "keyword").
 * Handles hover and selection interactions for the autocomplete popup.
 *
 * @param props - Component configuration
 * @param props.index - The item's position in the completion list
 * @param props.isSelected - Whether this item is currently selected
 * @param props.item - The completion item to display
 * @param props.onHoverItem - Called when the item is hovered
 * @param props.onSelectItem - Called when the item is selected
 * @returns A React component
 */
export function AppCodeCompletionItem({
    index,
    isSelected,
    item,
    onHoverItem,
    onSelectItem,
}: AppCodeCompletionItemProps): ReactElement {
    const compactDetail = getCompactLuauCompletionDetailLabel(item.detail);

    return (
        <button
            type="button"
            role="option"
            aria-selected={isSelected}
            onMouseEnter={() => onHoverItem(index)}
            onMouseDown={(event) => {
                event.preventDefault();
                onSelectItem(index);
            }}
            className={`app-select-none flex h-7 w-full items-center gap-2 rounded-[0.65rem] px-2 text-left ${
                isSelected
                    ? "bg-fumi-100 text-fumi-900"
                    : "text-fumi-600 hover:bg-fumi-50 hover:text-fumi-900"
            }`}
        >
            <span className="min-w-0 flex-1 truncate text-[10px] font-semibold leading-[1.15] tracking-[0.01em]">
                {item.label}
            </span>
            <span
                className={`inline-flex h-4 shrink-0 items-center justify-center rounded-full border px-1.5 text-[7.5px] font-semibold uppercase leading-none tracking-[0.1em] ${
                    isSelected
                        ? "border-fumi-300 bg-fumi-100 text-fumi-900"
                        : "border-fumi-200 bg-fumi-50 text-fumi-500"
                }`}
            >
                {compactDetail}
            </span>
        </button>
    );
}
