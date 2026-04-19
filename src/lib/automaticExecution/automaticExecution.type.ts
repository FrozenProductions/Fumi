import type { ExecutorKind } from "../workspace/workspace.type";

export type AutomaticExecutionCursorState = {
    line: number;
    column: number;
    scrollTop: number;
};

export type AutomaticExecutionScriptState = {
    id: string;
    fileName: string;
    cursor: AutomaticExecutionCursorState;
};

export type AutomaticExecutionScriptSnapshot = AutomaticExecutionScriptState & {
    content: string;
    isDirty: boolean;
};

export type AutomaticExecutionMetadata = {
    version: 2;
    activeScriptId: string | null;
    scripts: AutomaticExecutionScriptState[];
};

export type AutomaticExecutionSnapshot = {
    executorKind: ExecutorKind;
    resolvedPath: string;
    metadata: AutomaticExecutionMetadata;
    scripts: AutomaticExecutionScriptSnapshot[];
};

export type AutomaticExecutionScript = AutomaticExecutionScriptSnapshot & {
    savedContent: string;
};
