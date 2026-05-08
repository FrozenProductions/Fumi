import type {
    ChangeEvent,
    KeyboardEvent as ReactKeyboardEvent,
    RefObject,
} from "react";
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

export type AutomaticExecutionScriptRowProps = {
    script: AutomaticExecutionScript;
    isActive: boolean;
    isRenaming: boolean;
    hasRenameError: boolean;
    isRenameSubmitting: boolean;
    renameInputRef: RefObject<HTMLInputElement | null>;
    renameValue: string;
    onDeleteScript: (scriptId: string, fileName: string) => void;
    onRenameInputBlur: (script: AutomaticExecutionScript) => void;
    onRenameInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
    onRenameInputKeyDown: (
        event: ReactKeyboardEvent<HTMLInputElement>,
        script: AutomaticExecutionScript,
    ) => void;
    onSelectScript: (scriptId: string) => void;
    onStartRename: (script: AutomaticExecutionScript) => void;
};
