import { Add01Icon, FolderOpenIcon } from "@hugeicons/core-free-icons";
import type { ReactElement } from "react";
import { useAutomaticExecutionRename } from "../../hooks/automaticExecution/useAutomaticExecutionRename";
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
    const rename = useAutomaticExecutionRename({
        scripts,
        onRenameScript,
        onSelectScript,
    });

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
                        const isRenaming =
                            script.id === rename.renamingScriptId;

                        return (
                            <AutomaticExecutionScriptRow
                                key={script.id}
                                script={script}
                                isActive={isActive}
                                isRenaming={isRenaming}
                                hasRenameError={rename.hasRenameError}
                                isRenameSubmitting={rename.isRenameSubmitting}
                                renameInputRef={rename.renameInputRef}
                                renameValue={rename.renameValue}
                                onDeleteScript={onDeleteScript}
                                onRenameInputBlur={rename.handleRenameInputBlur}
                                onRenameInputChange={
                                    rename.handleRenameInputChange
                                }
                                onRenameInputKeyDown={
                                    rename.handleRenameInputKeyDown
                                }
                                onSelectScript={onSelectScript}
                                onStartRename={rename.handleStartRename}
                            />
                        );
                    })}
                </div>
            </div>
        </aside>
    );
}
