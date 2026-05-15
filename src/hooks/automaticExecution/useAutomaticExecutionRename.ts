import type { ChangeEvent, KeyboardEvent as ReactKeyboardEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_AUTOMATIC_EXECUTION_FILE_NAME_LENGTH } from "../../constants/automaticExecution/automaticExecution";
import { clampAutomaticExecutionText } from "../../lib/automaticExecution/automaticExecution";
import type { AutomaticExecutionScript } from "../../lib/automaticExecution/automaticExecution.type";
import {
    buildWorkspaceFileName,
    splitWorkspaceFileName,
} from "../../lib/workspace/fileName";

type UseAutomaticExecutionRenameOptions = {
    scripts: AutomaticExecutionScript[];
    onRenameScript: (
        scriptId: string,
        currentFileName: string,
    ) => Promise<boolean>;
    onSelectScript: (scriptId: string) => void;
};

type UseAutomaticExecutionRenameResult = {
    hasRenameError: boolean;
    isRenameSubmitting: boolean;
    renameInputRef: React.RefObject<HTMLInputElement | null>;
    renameValue: string;
    renamingScriptId: string | null;
    handleRenameInputBlur: (script: AutomaticExecutionScript) => void;
    handleRenameInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
    handleRenameInputKeyDown: (
        event: ReactKeyboardEvent<HTMLInputElement>,
        script: AutomaticExecutionScript,
    ) => void;
    handleStartRename: (script: AutomaticExecutionScript) => void;
};

export function useAutomaticExecutionRename({
    scripts,
    onRenameScript,
    onSelectScript,
}: UseAutomaticExecutionRenameOptions): UseAutomaticExecutionRenameResult {
    const renameInputRef = useRef<HTMLInputElement | null>(null);
    const skipRenameCommitOnBlurRef = useRef(false);
    const [renamingScriptId, setRenamingScriptId] = useState<string | null>(
        null,
    );
    const [renameValue, setRenameValue] = useState("");
    const [isRenameSubmitting, setIsRenameSubmitting] = useState(false);
    const [hasRenameError, setHasRenameError] = useState(false);

    const resetRenameState = useCallback((): void => {
        skipRenameCommitOnBlurRef.current = false;
        setRenamingScriptId(null);
        setRenameValue("");
        setIsRenameSubmitting(false);
        setHasRenameError(false);
    }, []);

    const focusRenameInput = useCallback((): void => {
        window.requestAnimationFrame(() => {
            const input = renameInputRef.current;

            if (!input) {
                return;
            }

            input.focus();
            input.select();
        });
    }, []);

    const handleStartRename = (script: AutomaticExecutionScript): void => {
        if (isRenameSubmitting) {
            return;
        }

        const { baseName } = splitWorkspaceFileName(script.fileName);

        onSelectScript(script.id);
        setRenamingScriptId(script.id);
        setRenameValue(baseName);
        setHasRenameError(false);
    };

    const commitRename = async (
        script: AutomaticExecutionScript,
    ): Promise<void> => {
        if (isRenameSubmitting || renamingScriptId !== script.id) {
            return;
        }

        const nextBaseName = renameValue.trim();

        if (!nextBaseName) {
            setHasRenameError(true);
            focusRenameInput();
            return;
        }

        const { baseName, extension } = splitWorkspaceFileName(script.fileName);
        if (nextBaseName === baseName) {
            resetRenameState();
            return;
        }

        setIsRenameSubmitting(true);
        let didRename = false;

        try {
            didRename = await onRenameScript(
                script.id,
                buildWorkspaceFileName(nextBaseName, extension),
            );
        } catch {
            setHasRenameError(true);
            focusRenameInput();
            return;
        } finally {
            setIsRenameSubmitting(false);
        }

        if (didRename) {
            resetRenameState();
            return;
        }

        setHasRenameError(true);
        focusRenameInput();
    };

    const cancelRename = (): void => {
        skipRenameCommitOnBlurRef.current = true;
        resetRenameState();
    };

    const handleRenameInputChange = (
        event: ChangeEvent<HTMLInputElement>,
    ): void => {
        setRenameValue(
            clampAutomaticExecutionText(
                event.target.value,
                MAX_AUTOMATIC_EXECUTION_FILE_NAME_LENGTH,
            ),
        );
        setHasRenameError(false);
    };

    const handleRenameInputKeyDown = (
        event: ReactKeyboardEvent<HTMLInputElement>,
        script: AutomaticExecutionScript,
    ): void => {
        if (event.key === "Enter") {
            event.preventDefault();
            void commitRename(script);
            return;
        }

        if (event.key !== "Escape") {
            return;
        }

        event.preventDefault();
        cancelRename();
    };

    const handleRenameInputBlur = (script: AutomaticExecutionScript): void => {
        if (skipRenameCommitOnBlurRef.current) {
            skipRenameCommitOnBlurRef.current = false;
            return;
        }

        void commitRename(script);
    };

    useEffect(() => {
        if (!renamingScriptId) {
            return;
        }

        focusRenameInput();
    }, [focusRenameInput, renamingScriptId]);

    useEffect(() => {
        if (!renamingScriptId) {
            return;
        }

        const hasRenamingScript = scripts.some(
            (script) => script.id === renamingScriptId,
        );

        if (hasRenamingScript) {
            return;
        }

        resetRenameState();
    }, [renamingScriptId, resetRenameState, scripts]);

    useEffect(() => {
        if (!hasRenameError) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setHasRenameError(false);
        }, 1000);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [hasRenameError]);

    return {
        hasRenameError,
        isRenameSubmitting,
        renameInputRef,
        renameValue,
        renamingScriptId,
        handleRenameInputBlur,
        handleRenameInputChange,
        handleRenameInputKeyDown,
        handleStartRename,
    };
}
