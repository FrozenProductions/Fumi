import type {
    AutomaticExecutionScript,
    AutomaticExecutionScriptSnapshot,
    AutomaticExecutionScriptState,
} from "./automaticExecution.type";

/**
 * Counts Unicode characters in a string (handles multi-byte chars correctly).
 */
export function getAutomaticExecutionCharacterCount(value: string): number {
    return Array.from(value).length;
}

/**
 * Truncates a string to a maximum number of Unicode characters.
 */
export function clampAutomaticExecutionText(
    value: string,
    maxLength: number,
): string {
    return Array.from(value).slice(0, maxLength).join("");
}

/**
 * Converts a script snapshot into a full script with savedContent initialized to content.
 */
export function buildAutomaticExecutionScript(
    script: AutomaticExecutionScriptSnapshot,
): AutomaticExecutionScript {
    return {
        ...script,
        savedContent: script.content,
    };
}

/**
 * Maps an array of snapshots to full scripts with savedContent initialized.
 */
export function buildAutomaticExecutionScripts(
    scripts: readonly AutomaticExecutionScriptSnapshot[],
): AutomaticExecutionScript[] {
    return scripts.map(buildAutomaticExecutionScript);
}

/**
 * Checks if any script has unsaved content changes.
 */
export function hasAutomaticExecutionDirtyScripts(
    scripts: readonly AutomaticExecutionScript[],
): boolean {
    return scripts.some((script) => script.content !== script.savedContent);
}

/**
 * Serializes a script to its persistent state (id, fileName, cursor only).
 */
export function serializeAutomaticExecutionScriptState(
    script: AutomaticExecutionScript,
): AutomaticExecutionScriptState {
    return {
        id: script.id,
        fileName: script.fileName,
        cursor: script.cursor,
    };
}
