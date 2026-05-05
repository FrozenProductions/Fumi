import { Add01Icon, FolderOpenIcon } from "@hugeicons/core-free-icons";
import type {
    ChangeEvent,
    ReactElement,
    KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_AUTOMATIC_EXECUTION_FILE_NAME_LENGTH } from "../../constants/automaticExecution/automaticExecution";
import { clampAutomaticExecutionText } from "../../lib/automaticExecution/automaticExecution";
import type { AutomaticExecutionScript } from "../../lib/automaticExecution/automaticExecution.type";
import {
    buildWorkspaceFileName,
    splitWorkspaceFileName,
} from "../../lib/workspace/fileName";
import { AppIcon } from "../app/common/AppIcon";
import { AppIconButton } from "../app/common/AppIconButton";
import { AppTooltip } from "../app/tooltip/AppTooltip";
import { AutomaticExecutionScriptRow } from "./AutomaticExecutionScriptRow";
import type { AutomaticExecutionSidebarProps } from "./automaticExecution.type";

/**
 * The sidebar for automatic execution script management.
 *
 * @param props - Component props
 * @param props.scripts - All scripts
 * @param props.activeScriptId - Currently active script ID
 * @param props.resolvedPath - Resolved folder path
 * @param props.onCreateScript - Create new script
 * @param props.onSelectScript - Select a script
 * @returns A React component
 */
export function AutomaticExecutionSidebar({
    scripts,
    activeScriptId,
    resolvedPath,
    onCreateScript,
    onOpenInFinder,
    onSelectScript,
    onRenameScript,
    onDeleteScript,
}: AutomaticExecutionSidebarProps): ReactElement {
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

    const canOpenInFinder = resolvedPath !== null;

    return (
        <aside className="flex w-[14.5rem] shrink-0 flex-col border-r border-fumi-200 bg-fumi-100">
            <div className="border-b border-fumi-200 px-3 py-2.5">
                <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 text-[10px] font-semibold uppercase tracking-[0.32em] text-fumi-500">
                        Automatic Execution
                    </p>
                    <div className="flex items-center gap-1">
                        <AppTooltip
                            content={
                                canOpenInFinder
                                    ? "Open in Finder"
                                    : "Automatic execution folder is unavailable"
                            }
                        >
                            <AppIconButton
                                ariaLabel="Open automatic execution folder in Finder"
                                onClick={onOpenInFinder}
                                disabled={!canOpenInFinder}
                                className="size-7 rounded-[0.55rem] disabled:pointer-events-none disabled:opacity-50"
                            >
                                <AppIcon
                                    icon={FolderOpenIcon}
                                    size={14}
                                    strokeWidth={2.2}
                                />
                            </AppIconButton>
                        </AppTooltip>
                        <AppTooltip content="Create new script">
                            <AppIconButton
                                ariaLabel="Create automatic execution script"
                                onClick={onCreateScript}
                                className="size-7 rounded-[0.55rem]"
                            >
                                <AppIcon
                                    icon={Add01Icon}
                                    size={15}
                                    strokeWidth={2.2}
                                />
                            </AppIconButton>
                        </AppTooltip>
                    </div>
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-1.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex flex-col gap-0.5">
                    {scripts.map((script) => {
                        const isActive = script.id === activeScriptId;
                        const isRenaming = script.id === renamingScriptId;

                        return (
                            <AutomaticExecutionScriptRow
                                key={script.id}
                                script={script}
                                isActive={isActive}
                                isRenaming={isRenaming}
                                hasRenameError={hasRenameError}
                                isRenameSubmitting={isRenameSubmitting}
                                renameInputRef={renameInputRef}
                                renameValue={renameValue}
                                onDeleteScript={onDeleteScript}
                                onRenameInputBlur={handleRenameInputBlur}
                                onRenameInputChange={handleRenameInputChange}
                                onRenameInputKeyDown={handleRenameInputKeyDown}
                                onSelectScript={onSelectScript}
                                onStartRename={handleStartRename}
                            />
                        );
                    })}
                </div>
            </div>
        </aside>
    );
}
