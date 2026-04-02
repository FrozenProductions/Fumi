import type { ComponentType } from "react";

export const WORKSPACE_EDITOR_FONT_FAMILY =
    '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace';

export const WORKSPACE_EDITOR_OPTIONS = {
    fontFamily: WORKSPACE_EDITOR_FONT_FAMILY,
    useWorker: false,
    displayIndentGuides: true,
    showFoldWidgets: false,
    scrollPastEnd: true,
} as const;

export const WORKSPACE_EDITOR_PROPS = {
    $blockScrolling: true,
} as const;

export const WORKSPACE_EDITOR_STYLE = {
    fontFamily: WORKSPACE_EDITOR_FONT_FAMILY,
} as const;

export type AceEditorComponent = ComponentType<Record<string, unknown>>;

export function getReactAceComponent(
    reactAceModule: typeof import("react-ace"),
): AceEditorComponent {
    const defaultExport: unknown = reactAceModule.default;

    if (typeof defaultExport === "function") {
        return defaultExport as AceEditorComponent;
    }

    if (
        defaultExport &&
        typeof defaultExport === "object" &&
        "default" in defaultExport &&
        typeof defaultExport.default === "function"
    ) {
        return defaultExport.default as AceEditorComponent;
    }

    throw new Error("React Ace component export is unavailable");
}
