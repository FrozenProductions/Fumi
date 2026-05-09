import { Delete02Icon, PencilEdit02Icon } from "@hugeicons/core-free-icons";
import type { ReactElement } from "react";
import { APP_TEXT_INPUT_PROPS } from "../../constants/app/input";
import { MAX_AUTOMATIC_EXECUTION_FILE_NAME_LENGTH } from "../../constants/automaticExecution/automaticExecution";
import { clampAutomaticExecutionText } from "../../lib/automaticExecution/automaticExecution";
import { joinClassNames } from "../../lib/shared/className";
import { splitWorkspaceFileName } from "../../lib/workspace/fileName";
import { AppIcon } from "../app/common/AppIcon";
import { AppIconButton } from "../app/common/AppIconButton";
import { AppTooltip } from "../app/tooltip/AppTooltip";
import type { AutomaticExecutionScriptRowProps } from "./automaticExecution.type";

const SCRIPT_ROW_GEOMETRY_CLASS = [
    "[--automatic-execution-script-row-radius:0.65rem]",
    "[--automatic-execution-script-action-vertical-inset:0.4rem]",
    "[--automatic-execution-script-action-left-inset:0.35rem]",
    "[--automatic-execution-script-action-right-inset:0.14rem]",
    "[--automatic-execution-script-action-button-size:1rem]",
    "[--automatic-execution-script-action-button-gap:0.125rem]",
    "[--automatic-execution-script-actions-rail-width:calc(var(--automatic-execution-script-action-left-inset)+var(--automatic-execution-script-action-button-size)*2+var(--automatic-execution-script-action-button-gap)+var(--automatic-execution-script-action-right-inset))]",
    "[--automatic-execution-script-content-clearance-width:calc(2.5rem-var(--automatic-execution-script-action-left-inset))]",
    "[--automatic-execution-script-content-reserve-width:calc(var(--automatic-execution-script-actions-rail-width)+var(--automatic-execution-script-content-clearance-width))]",
].join(" ");
const SCRIPT_ROW_RADIUS_CLASS =
    "rounded-[var(--automatic-execution-script-row-radius)]";
const ACTIONS_RAIL_WIDTH_CLASS =
    "w-[var(--automatic-execution-script-actions-rail-width)]";
const CONTENT_PADDING_RIGHT_CLASS =
    "pr-[var(--automatic-execution-script-content-reserve-width)]";
const ACTION_BUTTON_SIZE_CLASS =
    "size-[var(--automatic-execution-script-action-button-size)]";
const ACTION_BUTTON_RADIUS_CLASS =
    "rounded-[calc(var(--automatic-execution-script-action-button-size)*0.36)]";

/**
 * Renders a single script row in the automatic execution sidebar with rename, delete, and selection actions.
 *
 * @component
 * @param props.script - The script data to display
 * @param props.isActive - Whether this row is the currently selected script
 * @param props.isRenaming - Whether the rename input is active
 * @param props.hasRenameError - Whether the rename input is in an error state
 * @param props.isRenameSubmitting - Whether a rename is in progress
 * @param props.renameInputRef - Ref for the rename text input
 * @param props.renameValue - Current value of the rename input
 * @param props.onDeleteScript - Callback to delete the script
 * @param props.onRenameInputBlur - Callback when rename input loses focus
 * @param props.onRenameInputChange - Callback when rename input value changes
 * @param props.onRenameInputKeyDown - Callback on rename input keydown
 * @param props.onSelectScript - Callback when the row is clicked
 * @param props.onStartRename - Callback to initiate rename mode
 */
export function AutomaticExecutionScriptRow({
    script,
    isActive,
    isRenaming,
    hasRenameError,
    isRenameSubmitting,
    renameInputRef,
    renameValue,
    onDeleteScript,
    onRenameInputBlur,
    onRenameInputChange,
    onRenameInputKeyDown,
    onSelectScript,
    onStartRename,
}: AutomaticExecutionScriptRowProps): ReactElement {
    const isDirty = script.content !== script.savedContent;
    const { baseName } = splitWorkspaceFileName(script.fileName);
    const displayBaseName = clampAutomaticExecutionText(
        baseName,
        MAX_AUTOMATIC_EXECUTION_FILE_NAME_LENGTH,
    );
    const dirtyIndicator = (
        <span
            aria-hidden="true"
            className={joinClassNames(
                "inline-flex shrink-0 items-center justify-center overflow-hidden transition-[margin,max-width,opacity,transform] duration-200 ease-out",
                isDirty
                    ? "ml-1 max-w-2 translate-y-0 opacity-100"
                    : "ml-0 max-w-0 translate-y-1 opacity-0",
            )}
        >
            <span className="size-2 rounded-full bg-amber-500" />
        </span>
    );

    return (
        <div
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
                    className={`flex min-w-0 flex-1 items-center px-2.5 py-2 ${CONTENT_PADDING_RIGHT_CLASS}`}
                >
                    <div className="inline-flex min-w-0 max-w-full items-center">
                        <div className="relative inline-grid min-w-0 max-w-full flex-1">
                            <span className="invisible min-w-[1ch] overflow-hidden whitespace-pre text-clip pr-1 text-[0.8125rem] font-semibold tracking-[0.01em]">
                                {renameValue || " "}
                            </span>
                            <input
                                ref={renameInputRef}
                                type="text"
                                value={renameValue}
                                onBlur={() => {
                                    onRenameInputBlur(script);
                                }}
                                onChange={onRenameInputChange}
                                onKeyDown={(event) => {
                                    onRenameInputKeyDown(event, script);
                                }}
                                aria-label={`Rename ${script.fileName}`}
                                disabled={isRenameSubmitting}
                                {...APP_TEXT_INPUT_PROPS}
                                className="absolute inset-0 w-full min-w-0 border-none bg-transparent p-0 text-[0.8125rem] font-semibold tracking-[0.01em] text-fumi-600 outline-none placeholder:text-fumi-400 disabled:cursor-progress"
                            />
                        </div>
                        {dirtyIndicator}
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => {
                        onSelectScript(script.id);
                    }}
                    className={`flex min-w-0 flex-1 items-center px-2.5 py-2 ${CONTENT_PADDING_RIGHT_CLASS} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600`}
                >
                    <div className="inline-flex min-w-0 max-w-full items-center">
                        <p
                            className={`min-w-0 truncate text-[0.8125rem] font-semibold tracking-[0.01em] ${
                                isActive ? "text-fumi-900" : "text-fumi-500"
                            }`}
                        >
                            {displayBaseName}
                        </p>
                        {dirtyIndicator}
                    </div>
                </button>
            )}

            <div
                className={`pointer-events-none absolute inset-y-0 right-0 flex items-center justify-end gap-[var(--automatic-execution-script-action-button-gap)] py-[var(--automatic-execution-script-action-vertical-inset)] pl-[var(--automatic-execution-script-action-left-inset)] pr-[var(--automatic-execution-script-action-right-inset)] opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 ${ACTIONS_RAIL_WIDTH_CLASS}`}
            >
                <AppTooltip content="Rename">
                    <AppIconButton
                        ariaLabel={`Rename ${script.fileName}`}
                        onClick={(event) => {
                            event.stopPropagation();
                            onStartRename(script);
                        }}
                        className={`pointer-events-auto shrink-0 hover:bg-fumi-200 ${ACTION_BUTTON_SIZE_CLASS} ${ACTION_BUTTON_RADIUS_CLASS}`}
                        disabled={isRenameSubmitting}
                    >
                        <AppIcon
                            icon={PencilEdit02Icon}
                            size={14}
                            strokeWidth={2.2}
                        />
                    </AppIconButton>
                </AppTooltip>
                <AppTooltip content="Delete">
                    <AppIconButton
                        ariaLabel={`Delete ${script.fileName}`}
                        onClick={(event) => {
                            event.stopPropagation();
                            onDeleteScript(script.id, script.fileName);
                        }}
                        className={`pointer-events-auto shrink-0 text-red-400 hover:bg-fumi-200 hover:text-red-500 ${ACTION_BUTTON_SIZE_CLASS} ${ACTION_BUTTON_RADIUS_CLASS}`}
                    >
                        <AppIcon
                            icon={Delete02Icon}
                            size={14}
                            strokeWidth={2.2}
                        />
                    </AppIconButton>
                </AppTooltip>
            </div>
        </div>
    );
}
