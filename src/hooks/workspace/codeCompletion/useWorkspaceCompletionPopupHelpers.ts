import { getLuauCompletionPopupPosition } from "../../../lib/luau/completionPopup";
import type {
    LuauCompletionItem,
    LuauCompletionPopupState,
} from "../../../lib/luau/luau.type";
import type {
    AceEditorInstance,
    AceRendererInstance,
} from "../../../lib/workspace/codeCompletion/ace.type";
import type { UseWorkspaceCompletionPopupOptions } from "./useWorkspaceCompletionPopup.type";

export function isCompletionPopupInteractionTarget(
    target: EventTarget | null,
): boolean {
    return (
        target instanceof Element &&
        target.closest("[data-code-completion-popup='true']") !== null
    );
}

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
