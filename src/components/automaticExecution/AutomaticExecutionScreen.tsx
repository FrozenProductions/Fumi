import { Loading02Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import type { ReactElement } from "react";
import { useEffect } from "react";
import { useAppStore } from "../../hooks/app/useAppStore";
import { useAutomaticExecution } from "../../hooks/automaticExecution/useAutomaticExecution";
import { confirmAction } from "../../lib/platform/dialog";
import { openDirectoryPath } from "../../lib/platform/opener";
import { getErrorMessage } from "../../lib/shared/errorMessage";
import { AppIcon } from "../app/AppIcon";
import { AppTooltip } from "../app/AppTooltip";
import { AutomaticExecutionEditor } from "./AutomaticExecutionEditor";
import { AutomaticExecutionSidebar } from "./AutomaticExecutionSidebar";

export function AutomaticExecutionScreen(): ReactElement {
    const automaticExecution = useAutomaticExecution();
    const appTheme = useAppStore((state) => state.theme);
    const editorFontSize = useAppStore(
        (state) => state.editorSettings.fontSize,
    );
    const {
        activeScript,
        activeScriptId,
        errorMessage,
        executorKind,
        isBootstrapping,
        isRefreshing,
        resolvedPath,
        isSaving,
        scripts,
    } = automaticExecution.state;
    const {
        clearErrorMessage,
        createScript,
        deleteScript,
        renameScript,
        saveScript,
        selectScript,
        setErrorMessage,
        updateActiveScriptContent,
        updateActiveScriptCursor,
    } = automaticExecution.actions;
    const hasUnsavedChanges =
        activeScript?.content !== activeScript?.savedContent;
    const isSaveDisabled = !activeScript || !hasUnsavedChanges || isSaving;
    const saveButtonClassName = isSaving
        ? "app-select-none inline-flex h-8 items-center gap-1.5 rounded-[0.65rem] border border-fumi-300 bg-fumi-100 px-3 text-xs font-semibold text-fumi-700 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.55)] transition-[background-color,border-color,transform,box-shadow] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-2 focus-visible:ring-offset-fumi-50 disabled:cursor-progress"
        : hasUnsavedChanges
          ? "app-select-none inline-flex h-8 items-center gap-1.5 rounded-[0.65rem] border border-fumi-200 bg-fumi-600 px-3 text-xs font-semibold text-white shadow-sm transition-[background-color,border-color,box-shadow,transform] duration-150 ease-out hover:border-fumi-700 hover:bg-fumi-700 hover:shadow-md active:scale-[0.98] active:shadow-[inset_0_2px_4px_rgb(0_0_0_/_0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-2 focus-visible:ring-offset-fumi-50"
          : "app-select-none inline-flex h-8 items-center gap-1.5 rounded-[0.65rem] border border-fumi-200 bg-fumi-50 px-3 text-xs font-semibold text-fumi-400 transition-[background-color,border-color,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-2 focus-visible:ring-offset-fumi-50 disabled:cursor-default";

    const handleCreateScript = (): void => {
        void createScript(executorKind);
    };

    const handleSelectScript = (scriptId: string): void => {
        void selectScript(scriptId);
    };

    const handleRenameScript = (
        scriptId: string,
        currentFileName: string,
    ): Promise<boolean> => {
        return renameScript(executorKind, scriptId, currentFileName);
    };

    const handleDeleteScript = (scriptId: string, fileName: string): void => {
        void (async () => {
            const shouldDelete = await confirmAction(
                `Delete ${fileName} from automatic execution?`,
            );

            if (!shouldDelete) {
                return;
            }

            await deleteScript(executorKind, scriptId);
        })();
    };

    const handleOpenInFinder = (): void => {
        if (!resolvedPath) {
            return;
        }

        void (async () => {
            try {
                await openDirectoryPath(resolvedPath);
            } catch (error) {
                setErrorMessage(
                    getErrorMessage(
                        error,
                        "Could not open the automatic execution folder.",
                    ),
                );
            }
        })();
    };

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent): void => {
            const isSaveShortcut =
                (event.metaKey || event.ctrlKey) &&
                event.key.toLowerCase() === "s";

            if (!isSaveShortcut) {
                return;
            }

            if (!activeScript || isSaving) {
                return;
            }

            event.preventDefault();
            void saveScript(executorKind, activeScript.id);
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [activeScript, executorKind, isSaving, saveScript]);

    return (
        <section className="flex h-full min-h-0 bg-fumi-50">
            <AutomaticExecutionSidebar
                scripts={scripts}
                activeScriptId={activeScriptId}
                resolvedPath={resolvedPath}
                onCreateScript={handleCreateScript}
                onOpenInFinder={handleOpenInFinder}
                onSelectScript={handleSelectScript}
                onRenameScript={handleRenameScript}
                onDeleteScript={handleDeleteScript}
            />

            <div className="flex min-h-0 flex-1 flex-col">
                {activeScript ? (
                    <div className="flex items-center justify-between border-b border-fumi-200 bg-fumi-100/50 px-5 py-3">
                        <div className="flex items-center gap-2">
                            <h1 className="truncate text-sm font-semibold tracking-[-0.01em] text-fumi-900">
                                {activeScript.fileName}
                            </h1>
                            <span
                                aria-hidden="true"
                                className={[
                                    "inline-flex shrink-0 items-center justify-center overflow-hidden transition-[margin,max-width,opacity,transform] duration-200 ease-out",
                                    activeScript.content !==
                                    activeScript.savedContent
                                        ? "ml-1 max-w-2 translate-y-0 opacity-100"
                                        : "ml-0 max-w-0 translate-y-1 opacity-0",
                                ].join(" ")}
                            >
                                <span className="size-2 rounded-full bg-amber-500" />
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-[11px] font-semibold text-fumi-500">
                                {isBootstrapping ? (
                                    <span className="flex items-center gap-1.5">
                                        <AppIcon
                                            icon={Loading02Icon}
                                            size={12}
                                            className="animate-spin"
                                        />
                                        Loading
                                    </span>
                                ) : null}
                                {isRefreshing ? (
                                    <span className="flex items-center gap-1.5">
                                        <AppIcon
                                            icon={Loading02Icon}
                                            size={12}
                                            className="animate-spin"
                                        />
                                        Refreshing
                                    </span>
                                ) : null}
                                {isSaving ? (
                                    <span className="flex items-center gap-1.5">
                                        <AppIcon
                                            icon={Loading02Icon}
                                            size={12}
                                            className="animate-spin"
                                        />
                                        Saving
                                    </span>
                                ) : null}
                            </div>
                            <AppTooltip
                                content={
                                    isSaving
                                        ? "Saving script"
                                        : hasUnsavedChanges
                                          ? "Save script"
                                          : "All changes saved"
                                }
                                shortcut="⌘S"
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        void saveScript(
                                            executorKind,
                                            activeScript.id,
                                        );
                                    }}
                                    disabled={isSaveDisabled}
                                    className={saveButtonClassName}
                                >
                                    <AppIcon
                                        icon={
                                            isSaving
                                                ? Loading02Icon
                                                : Tick01Icon
                                        }
                                        size={14}
                                        strokeWidth={2.5}
                                        className={
                                            isSaving ? "animate-spin" : ""
                                        }
                                    />
                                    {isSaving
                                        ? "Saving"
                                        : hasUnsavedChanges
                                          ? "Save"
                                          : "Saved"}
                                </button>
                            </AppTooltip>
                        </div>
                    </div>
                ) : null}

                {errorMessage ? (
                    <div className="border-b border-red-200 bg-red-50/80 px-5 py-3">
                        <div className="flex items-center justify-between gap-4">
                            <div className="min-w-0">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-red-500">
                                    Error
                                </p>
                                <p className="mt-1 text-sm leading-6 text-red-700">
                                    {errorMessage}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={clearErrorMessage}
                                className="app-select-none shrink-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-red-500 transition-colors hover:text-red-700"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                ) : null}

                <div className="min-h-0 flex-1">
                    <AutomaticExecutionEditor
                        appTheme={appTheme}
                        editorFontSize={editorFontSize}
                        script={activeScript}
                        onChange={updateActiveScriptContent}
                        onCursorChange={updateActiveScriptCursor}
                    />
                </div>
            </div>
        </section>
    );
}
