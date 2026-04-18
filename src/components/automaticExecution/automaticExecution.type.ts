import type { AutomaticExecutionScript } from "../../lib/automaticExecution/automaticExecution.type";

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
