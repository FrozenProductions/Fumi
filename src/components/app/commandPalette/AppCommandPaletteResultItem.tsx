import type { ReactElement } from "react";
import { joinClassNames } from "../../../lib/shared/className";
import { AppIcon } from "../common/AppIcon";
import type { AppCommandPaletteResultsProps } from "./appCommandPalette.type";

type AppCommandPaletteResultItemProps = {
    index: number;
    isActive: boolean;
    item: AppCommandPaletteResultsProps["results"][number];
    onCommitSelection: AppCommandPaletteResultsProps["onCommitSelection"];
    onHoverItem: AppCommandPaletteResultsProps["onHoverItem"];
};

/**
 * Renders a single result item in the command palette dropdown.
 *
 * Displays the item's icon, label, optional description, and meta badge.
 * Handles hover and click interactions for selection.
 *
 * @param props - Component configuration
 * @param props.index - The item's position in the results list
 * @param props.isActive - Whether this item is currently selected
 * @param props.item - The command palette result to display
 * @param props.onCommitSelection - Called when the item is clicked
 * @param props.onHoverItem - Called when the item is hovered
 * @returns A React component
 */
export function AppCommandPaletteResultItem({
    index,
    isActive,
    item,
    onCommitSelection,
    onHoverItem,
}: AppCommandPaletteResultItemProps): ReactElement {
    const itemClassName = joinClassNames(
        "app-select-none flex h-10 w-full items-center gap-1.5 rounded-[var(--command-results-item-radius)] border px-2 text-left transition-[background-color,border-color,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-2 focus-visible:ring-offset-fumi-50",
        item.isDisabled && "cursor-default opacity-60",
        isActive
            ? "scale-[1.01] border-transparent bg-fumi-100/70"
            : "border-transparent bg-transparent",
    );
    const iconClassName = joinClassNames(
        "inline-flex size-6 shrink-0 items-center justify-center rounded-[var(--command-results-element-radius)] border",
        isActive
            ? "border-fumi-200 bg-fumi-50 text-fumi-700"
            : "border-fumi-200 bg-fumi-50 text-fumi-500",
    );

    return (
        <button
            type="button"
            aria-disabled={item.isDisabled === true}
            onClick={() => onCommitSelection(item)}
            onPointerEnter={() => onHoverItem(index)}
            onPointerMove={() => onHoverItem(index)}
            className={itemClassName}
        >
            <span className={iconClassName}>
                <AppIcon icon={item.icon} size={13} strokeWidth={2.5} />
            </span>
            <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] font-semibold text-fumi-800">
                    {item.label}
                </span>
                {item.description ? (
                    <span className="mt-px block truncate text-[10px] text-fumi-400">
                        {item.description}
                    </span>
                ) : null}
            </span>
            {item.meta ? (
                <span className="shrink-0 rounded-[var(--command-results-element-radius)] border border-fumi-200 bg-fumi-50 px-1.5 py-0.5 text-[9px] font-semibold text-fumi-400">
                    {item.meta}
                </span>
            ) : null}
        </button>
    );
}
