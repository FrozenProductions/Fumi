import type { ReactElement } from "react";
import { getCompactLuauCompletionDetailLabel } from "../../lib/luau/completionPopup";
import type { AppCodeCompletionProps } from "./workspaceEditor.type";

export function AppCodeCompletion({
    items,
    selectedIndex,
    position,
    onHoverItem,
    onSelectItem,
}: AppCodeCompletionProps): ReactElement | null {
    const selectedItem = items[selectedIndex] ?? items[0];

    if (!selectedItem) {
        return null;
    }

    return (
        <div
            data-code-completion-popup="true"
            className="fixed z-[90] overflow-hidden rounded-[0.85rem] border border-fumi-200 bg-fumi-50 shadow-[var(--shadow-app-floating)]"
            style={{
                left: position.left,
                top: position.top,
                width: position.width,
            }}
        >
            <div
                className="flex flex-col gap-1 overflow-hidden p-1.5"
                style={{ height: position.maxHeight }}
                role="listbox"
                aria-label="Code completions"
            >
                {items.map((item, index) => {
                    const isSelected = index === selectedIndex;
                    const compactDetail = getCompactLuauCompletionDetailLabel(
                        item.detail,
                    );

                    return (
                        <button
                            key={`${item.label}:${item.detail}:${item.namespace ?? "root"}:${item.doc.source}`}
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
                })}
            </div>
        </div>
    );
}
