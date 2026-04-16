import {
    Add01Icon,
    Delete02Icon,
    File02Icon,
    PencilEdit02Icon,
} from "@hugeicons/core-free-icons";
import type {
    ChangeEvent,
    ReactElement,
    KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { APP_TEXT_INPUT_PROPS } from "../../constants/app/input";
import { MAX_AUTOMATIC_EXECUTION_FILE_NAME_LENGTH } from "../../constants/automaticExecution/automaticExecution";
import type { AutomaticExecutionScript } from "../../lib/automaticExecution/automaticExecution.type";
import {
    buildWorkspaceFileName,
    splitWorkspaceFileName,
} from "../../lib/workspace/fileName";
import { AppIcon } from "../app/AppIcon";
import { AppIconButton } from "../app/AppIconButton";
import { AppTooltip } from "../app/AppTooltip";

type AutomaticExecutionSidebarProps = {
    scripts: AutomaticExecutionScript[];
    activeScriptId: string | null;
    onCreateScript: () => void;
    onSelectScript: (scriptId: string) => void;
    onRenameScript: (
        scriptId: string,
        currentFileName: string,
    ) => Promise<boolean>;
    onDeleteScript: (scriptId: string, fileName: string) => void;
};

export function AutomaticExecutionSidebar({
    scripts,
    activeScriptId,
    onCreateScript,
    onSelectScript,
    onRenameScript,
    onDeleteScript,
}: AutomaticExecutionSidebarProps): ReactElement {
    const SCRIPT_ROW_GEOMETRY_CLASS = [
        "[--automatic-execution-script-row-radius:0.65rem]",
        "[--automatic-execution-script-action-vertical-inset:0.4rem]",
        "[--automatic-execution-script-action-right-inset:0.14rem]",
        "[--automatic-execution-script-action-button-size:1.25rem]",
        "[--automatic-execution-script-action-button-gap:0.125rem]",
        "[--automatic-execution-script-actions-rail-width:calc(var(--automatic-execution-script-action-button-size)*2+var(--automatic-execution-script-action-button-gap)+var(--automatic-execution-script-action-right-inset))]",
    ].join(" ");
    const SCRIPT_ROW_RADIUS_CLASS =
        "rounded-[var(--automatic-execution-script-row-radius)]";
    const ACTIONS_RAIL_WIDTH_CLASS =
        "w-[var(--automatic-execution-script-actions-rail-width)]";
    const CONTENT_MAX_WIDTH_CLASS =
        "max-w-[calc(100%-var(--automatic-execution-script-actions-rail-width))]";
    const CONTENT_PADDING_RIGHT_CLASS =
        "pr-[calc(var(--automatic-execution-script-actions-rail-width)+0.45rem)]";
    const ACTION_BUTTON_SIZE_CLASS =
        "size-[var(--automatic-execution-script-action-button-size)]";
    const ACTION_BUTTON_RADIUS_CLASS =
        "rounded-[calc(var(--automatic-execution-script-action-button-size)*0.36)]";

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
        const didRename = await onRenameScript(
            script.id,
            buildWorkspaceFileName(nextBaseName, extension || ".lua"),
        );
        setIsRenameSubmitting(false);

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
        setRenameValue(event.target.value);
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

    return (
        <aside className="flex w-[15.5rem] shrink-0 flex-col border-r border-fumi-200 bg-fumi-100">
            <div className="border-b border-fumi-200 px-3 py-2.5">
                <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 text-[10px] font-semibold uppercase tracking-[0.32em] text-fumi-500">
                        Automatic Execution
                    </p>
                    <AppTooltip content="Create new script">
                        <AppIconButton
                            ariaLabel="Create automatic execution script"
                            onClick={onCreateScript}
                        >
                            <AppIcon
                                icon={Add01Icon}
                                size={16}
                                strokeWidth={2.2}
                            />
                        </AppIconButton>
                    </AppTooltip>
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-1.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {scripts.length === 0 ? (
                    <div className="rounded-[0.8rem] border border-dashed border-fumi-200 bg-fumi-50 px-3 py-4 text-center">
                        <AppIcon
                            icon={File02Icon}
                            size={20}
                            strokeWidth={2}
                            className="mx-auto mb-2 text-fumi-400"
                        />
                        <p className="text-xs font-semibold text-fumi-700">
                            No scripts yet
                        </p>
                        <p className="mt-1 text-[11px] leading-5 text-fumi-500">
                            Create a script to start editing
                        </p>
                    </div>
                ) : null}

                <div className="flex flex-col gap-0.5">
                    {scripts.map((script) => {
                        const isActive = script.id === activeScriptId;
                        const isRenaming = script.id === renamingScriptId;
                        const isDirty = script.content !== script.savedContent;
                        const { baseName } = splitWorkspaceFileName(
                            script.fileName,
                        );
                        const displayBaseName = baseName.slice(
                            0,
                            MAX_AUTOMATIC_EXECUTION_FILE_NAME_LENGTH,
                        );

                        return (
                            <div
                                key={script.id}
                                className={`app-select-none group relative flex w-full items-center overflow-hidden border text-left transition-[background-color,border-color,box-shadow] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 ${SCRIPT_ROW_GEOMETRY_CLASS} ${SCRIPT_ROW_RADIUS_CLASS} ${
                                    isRenaming && hasRenameError
                                        ? "border-rose-400 bg-rose-50 ring-2 ring-rose-200/50 shadow-sm"
                                        : isActive
                                          ? "border-fumi-200 bg-fumi-50 shadow-sm"
                                          : "border-transparent bg-transparent hover:border-fumi-200 hover:bg-fumi-50/80"
                                }`}
                            >
                                {isRenaming ? (
                                    <div
                                        className={`flex min-w-0 flex-1 items-center px-2.5 py-2 ${CONTENT_PADDING_RIGHT_CLASS} ${CONTENT_MAX_WIDTH_CLASS}`}
                                    >
                                        <div className="relative inline-grid min-w-0 max-w-full flex-1">
                                            <span className="invisible min-w-[1ch] overflow-hidden whitespace-pre text-clip pr-1 text-[0.8125rem] font-semibold tracking-[0.01em]">
                                                {renameValue || " "}
                                            </span>
                                            <input
                                                ref={renameInputRef}
                                                type="text"
                                                value={renameValue}
                                                maxLength={
                                                    MAX_AUTOMATIC_EXECUTION_FILE_NAME_LENGTH
                                                }
                                                onBlur={() => {
                                                    handleRenameInputBlur(
                                                        script,
                                                    );
                                                }}
                                                onChange={
                                                    handleRenameInputChange
                                                }
                                                onKeyDown={(event) => {
                                                    handleRenameInputKeyDown(
                                                        event,
                                                        script,
                                                    );
                                                }}
                                                aria-label={`Rename ${script.fileName}`}
                                                disabled={isRenameSubmitting}
                                                {...APP_TEXT_INPUT_PROPS}
                                                className="absolute inset-0 w-full min-w-0 border-none bg-transparent p-0 text-[0.8125rem] font-semibold tracking-[0.01em] text-fumi-600 outline-none placeholder:text-fumi-400 disabled:cursor-progress"
                                            />
                                        </div>
                                        <span
                                            aria-hidden="true"
                                            className={[
                                                "inline-flex shrink-0 items-center justify-center overflow-hidden transition-[margin,max-width,opacity,transform] duration-200 ease-out",
                                                isDirty
                                                    ? "ml-2 max-w-2 translate-y-0 opacity-100"
                                                    : "ml-0 max-w-0 translate-y-1 opacity-0",
                                            ].join(" ")}
                                        >
                                            <span className="size-2 rounded-full bg-amber-500" />
                                        </span>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            onSelectScript(script.id)
                                        }
                                        className={`flex min-w-0 flex-1 items-center px-2.5 py-2 ${CONTENT_PADDING_RIGHT_CLASS} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 ${CONTENT_MAX_WIDTH_CLASS}`}
                                    >
                                        <p
                                            className={`truncate text-[0.8125rem] font-semibold tracking-[0.01em] ${
                                                isActive
                                                    ? "text-fumi-900"
                                                    : "text-fumi-500"
                                            }`}
                                        >
                                            {displayBaseName}
                                        </p>
                                        <span
                                            aria-hidden="true"
                                            className={[
                                                "inline-flex shrink-0 items-center justify-center overflow-hidden transition-[margin,max-width,opacity,transform] duration-200 ease-out",
                                                isDirty
                                                    ? "ml-2 max-w-2 translate-y-0 opacity-100"
                                                    : "ml-0 max-w-0 translate-y-1 opacity-0",
                                            ].join(" ")}
                                        >
                                            <span className="size-2 rounded-full bg-amber-500" />
                                        </span>
                                    </button>
                                )}

                                <div
                                    className={`pointer-events-none absolute inset-y-0 right-0 flex items-center justify-end gap-[var(--automatic-execution-script-action-button-gap)] py-[var(--automatic-execution-script-action-vertical-inset)] pr-[var(--automatic-execution-script-action-right-inset)] opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 ${ACTIONS_RAIL_WIDTH_CLASS}`}
                                >
                                    <AppTooltip content="Rename">
                                        <AppIconButton
                                            ariaLabel={`Rename ${script.fileName}`}
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                handleStartRename(script);
                                            }}
                                            className={`pointer-events-auto shrink-0 hover:bg-fumi-200 ${ACTION_BUTTON_SIZE_CLASS} ${ACTION_BUTTON_RADIUS_CLASS}`}
                                            disabled={isRenameSubmitting}
                                        >
                                            <AppIcon
                                                icon={PencilEdit02Icon}
                                                size={12}
                                                strokeWidth={2.2}
                                            />
                                        </AppIconButton>
                                    </AppTooltip>
                                    <AppTooltip content="Delete">
                                        <AppIconButton
                                            ariaLabel={`Delete ${script.fileName}`}
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                onDeleteScript(
                                                    script.id,
                                                    script.fileName,
                                                );
                                            }}
                                            className={`pointer-events-auto shrink-0 text-red-400 hover:bg-fumi-200 hover:text-red-500 ${ACTION_BUTTON_SIZE_CLASS} ${ACTION_BUTTON_RADIUS_CLASS}`}
                                        >
                                            <AppIcon
                                                icon={Delete02Icon}
                                                size={12}
                                                strokeWidth={2.2}
                                            />
                                        </AppIconButton>
                                    </AppTooltip>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </aside>
    );
}
