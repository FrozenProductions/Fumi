import type { AutomaticExecutionScript } from "../../lib/automaticExecution/automaticExecution.type";
import type { ExecutorKind } from "../../lib/workspace/workspace.type";

export type AutomaticExecutionScreenProps = {
    executorKind: ExecutorKind;
};

export type AutomaticExecutionSidebarProps = {
    scripts: AutomaticExecutionScript[];
    activeScriptId: string | null;
    resolvedPath: string | null;
    onCreateScript: () => void;
    onOpenInFinder: () => void;
    onSelectScript: (scriptId: string) => void;
    onRenameScript: (
        scriptId: string,
        currentFileName: string,
    ) => Promise<boolean>;
    onDeleteScript: (scriptId: string, fileName: string) => void;
};
