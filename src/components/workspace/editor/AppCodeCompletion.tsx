import type { CSSProperties, ReactElement } from "react";
import type { AppCodeCompletionProps } from "./AppCodeCompletion.type";
import { AppCodeCompletionItem } from "./AppCodeCompletionItem";

/**
 * Code completion popup displayed in the editor.
 *
 * @param props - Component props
 * @param props.items - Completion items to display
 * @param props.selectedIndex - Currently selected item index
 * @param props.position - Popup position and size
 * @param props.onHoverItem - Called when hovering an item
 * @param props.onSelectItem - Called when selecting an item
 * @returns A React component or null
 */
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

    const popupStyle = {
        left: position.left,
        top: position.top,
        width: position.width,
    } satisfies CSSProperties;
    const listStyle = {
        height: position.maxHeight,
    } satisfies CSSProperties;

    return (
        <div
            data-code-completion-popup="true"
            className="fixed z-[90] overflow-hidden rounded-[0.85rem] border border-fumi-200 bg-fumi-50 shadow-[var(--shadow-app-floating)]"
            style={popupStyle}
        >
            <div
                className="flex flex-col gap-1 overflow-hidden p-1.5"
                style={listStyle}
                role="listbox"
                aria-label="Code completions"
            >
                {items.map((item, index) => (
                    <AppCodeCompletionItem
                        key={`${item.label}:${item.detail}:${item.namespace ?? "root"}:${item.doc.source}`}
                        index={index}
                        isSelected={index === selectedIndex}
                        item={item}
                        onHoverItem={onHoverItem}
                        onSelectItem={onSelectItem}
                    />
                ))}
            </div>
        </div>
    );
}
