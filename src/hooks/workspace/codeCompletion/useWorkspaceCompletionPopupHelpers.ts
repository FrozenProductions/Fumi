import { getLuauCompletionPopupPosition } from "../../../lib/luau/completion/completionPopup";
import type {
    LuauCompletionItem,
    LuauCompletionPopupState,
} from "../../../lib/luau/luau.type";
import type {
    AceEditorInstance,
    AceRendererInstance,
} from "../../../lib/workspace/codeCompletion/ace.type";
import type { UseWorkspaceCompletionPopupOptions } from "./useWorkspaceCompletionPopup.type";

/**
 * Checks whether an event target is inside the code completion popup element.
 *
 * @param target - The event target to check
 * @returns True if the target is or is inside the completion popup
 */
export function isCompletionPopupInteractionTarget(
    target: EventTarget | null,
): boolean {
    return (
        target instanceof Element &&
        target.closest("[data-code-completion-popup='true']") !== null
    );
}

/**
 * Computes the index of the selected completion item, optionally preserving
 * the previously selected label across item list updates.
 *
 * @param options - Selection options
 * @param options.currentPopup - The previous popup state, or null
 * @param options.items - The current completion items
 * @param options.preserveSelection - Whether to carry the selected label forward
 * @returns The index of the selected item, or 0 if no match
 */
export function getSelectedCompletionIndex(options: {
    currentPopup: LuauCompletionPopupState | null;
    items: LuauCompletionItem[];
    preserveSelection?: boolean;
}): number {
    const { currentPopup, items, preserveSelection } = options;
    const selectedLabel =
        preserveSelection && currentPopup
            ? currentPopup.items[currentPopup.selectedIndex]?.label
            : null;

    if (selectedLabel === null) {
        return 0;
    }

    return Math.max(
        0,
        items.findIndex((item) => item.label === selectedLabel),
    );
}

/**
 * Shifts the completion popup selection by an offset, wrapping around the item list.
 *
 * @param currentPopup - The current popup state, or null if the popup is closed
 * @param offset - Number of positions to shift (positive for down, negative for up)
 * @returns Updated popup state with the new selection, or null if the popup was null
 */
export function shiftCompletionSelection(
    currentPopup: LuauCompletionPopupState | null,
    offset: number,
): LuauCompletionPopupState | null {
    if (!currentPopup) {
        return currentPopup;
    }

    return {
        ...currentPopup,
        selectedIndex:
            (currentPopup.selectedIndex + offset + currentPopup.items.length) %
            currentPopup.items.length,
    };
}

/**
 * Computes the completion popup position state based on the editor cursor and items.
 *
 * @param options - Position calculation options
 * @param options.cursor - The cursor row and column in the editor
 * @param options.editor - The Ace editor instance
 * @param options.items - The current completion items
 * @param options.intellisenseWidth - The configured intellisense panel width
 * @param options.previousPlacement - The previous vertical placement to preserve, if any
 * @returns Position coordinates and vertical placement for the popup
 */
export function getCompletionPopupPositionState(options: {
    cursor: {
        column: number;
        row: number;
    };
    editor: AceEditorInstance;
    items: LuauCompletionItem[];
    intellisenseWidth: UseWorkspaceCompletionPopupOptions["intellisenseWidth"];
    previousPlacement?: LuauCompletionPopupState["position"]["verticalPlacement"];
}) {
    const { cursor, editor, items, intellisenseWidth, previousPlacement } =
        options;
    const renderer = editor.renderer as AceRendererInstance;
    const caret = renderer.$cursorLayer.getPixelPosition(cursor, true);
    const editorBounds = editor.container.getBoundingClientRect();
    const caretHeight = Math.max(
        renderer.layerConfig?.lineHeight ?? renderer.lineHeight ?? 0,
        16,
    );
    const caretLeft =
        editorBounds.left +
        caret.left -
        (renderer.scrollLeft ?? 0) +
        (renderer.gutterWidth ?? 0);
    const caretTop =
        editorBounds.top + caret.top - (renderer.layerConfig?.offset ?? 0);

    return getLuauCompletionPopupPosition(
        caretLeft,
        caretTop,
        caretHeight,
        items,
        intellisenseWidth,
        previousPlacement,
    );
}
