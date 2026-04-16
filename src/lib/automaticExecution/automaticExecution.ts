import type {
    AutomaticExecutionScript,
    AutomaticExecutionScriptSnapshot,
    AutomaticExecutionScriptState,
} from "./automaticExecution.type";

export function getAutomaticExecutionCharacterCount(value: string): number {
    return Array.from(value).length;
}

export function clampAutomaticExecutionText(
    value: string,
    maxLength: number,
): string {
    return Array.from(value).slice(0, maxLength).join("");
}

export function buildAutomaticExecutionScript(
    script: AutomaticExecutionScriptSnapshot,
): AutomaticExecutionScript {
    return {
        ...script,
        savedContent: script.content,
    };
}

export function buildAutomaticExecutionScripts(
    scripts: readonly AutomaticExecutionScriptSnapshot[],
): AutomaticExecutionScript[] {
    return scripts.map(buildAutomaticExecutionScript);
}

export function hasAutomaticExecutionDirtyScripts(
    scripts: readonly AutomaticExecutionScript[],
): boolean {
    return scripts.some((script) => script.content !== script.savedContent);
}

export function serializeAutomaticExecutionScriptState(
    script: AutomaticExecutionScript,
): AutomaticExecutionScriptState {
    return {
        id: script.id,
        fileName: script.fileName,
        cursor: script.cursor,
    };
}
