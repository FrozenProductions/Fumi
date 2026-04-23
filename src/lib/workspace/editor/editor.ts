import type { AceEditorComponent } from "./editor.type";

/**
 * Resolves the React Ace editor component from a dynamic import, handling nested default exports.
 *
 * @throws {Error} If the editor component export is unavailable.
 */
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
