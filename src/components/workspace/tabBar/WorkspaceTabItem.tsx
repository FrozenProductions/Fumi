import { useSortable } from "@dnd-kit/react/sortable";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import type { ReactElement, MouseEvent as ReactMouseEvent } from "react";
import { APP_HOTKEYS } from "../../../constants/app/hotkeys";
import { APP_TEXT_INPUT_PROPS } from "../../../constants/app/input";
import { MAX_WORKSPACE_TAB_NAME_LENGTH } from "../../../constants/workspace/workspace";
import { splitWorkspaceFileName } from "../../../lib/workspace/fileName";
import { AppIcon } from "../../app/AppIcon";
import { AppTooltip } from "../../app/AppTooltip";
import type { WorkspaceTabItemProps } from "./workspaceTabBar.type";

export function WorkspaceTabItem({
    index,
    sortableGroup,
    tab,
    isActive,
    isTabDragActive,
    middleClickTabAction,
    onOpenContextMenu,
    onArchiveTab,
    onDeleteTab,
    onSelectTab,
    handleRenameInputBlur,
    handleRenameInputChange,
    handleRenameInputKeyDown,
    handleStartRename,
    hasRenameError,
    isRenameSubmitting,
    renameInputRef,
    renameValue,
    renamingTabId,
}: WorkspaceTabItemProps): ReactElement {
    const isDirty = tab.content !== tab.savedContent;
    const isRenaming = tab.id === renamingTabId;
    const { baseName } = splitWorkspaceFileName(tab.fileName);
    const { handleRef, isDragging, isDropTarget, ref } = useSortable({
        id: tab.id,
        index,
        group: sortableGroup,
        disabled: isRenaming,
    });
    const shouldShowDropTarget = isDropTarget && !isTabDragActive;

    const handleMiddleClick = (
        event: ReactMouseEvent<HTMLDivElement>,
    ): void => {
        if (event.button !== 1 || isRenaming) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        if (middleClickTabAction === "delete") {
            onDeleteTab(tab.id);
            return;
        }

        onArchiveTab(tab.id);
    };

    return (
        <div
            ref={ref}
            data-tab-id={tab.id}
            onMouseDownCapture={(event) => {
                if (event.button !== 1 && event.button !== 2) {
                    return;
                }

                event.preventDefault();
            }}
            onAuxClick={handleMiddleClick}
            onContextMenu={(event) => {
                onOpenContextMenu(tab.id, event);
            }}
            onDoubleClick={() => handleStartRename(tab.id, tab.fileName)}
            className={[
                "group relative flex shrink-0 items-center overflow-hidden rounded-[0.75rem] border transition-[background-color,border-color,box-shadow,transform] duration-150",
                isDragging
                    ? "z-10 border-fumi-300 bg-fumi-50/95 shadow-lg"
                    : isActive
                      ? isRenaming && hasRenameError
                          ? "border-rose-400 bg-rose-50 ring-2 ring-rose-200/50 shadow-sm"
                          : "border-fumi-200 bg-fumi-50 shadow-sm"
                      : shouldShowDropTarget
                        ? "border-fumi-300 bg-fumi-50"
                        : isTabDragActive
                          ? "border-transparent bg-transparent"
                          : "border-transparent bg-transparent hover:border-fumi-200 hover:bg-fumi-50",
            ].join(" ")}
        >
            {isRenaming ? (
                <div className="flex max-w-[15rem] items-center py-1.5 pl-3 pr-3 text-[0.8125rem] font-semibold tracking-[0.01em] text-fumi-600">
                    <div className="relative inline-grid min-w-0 max-w-full">
                        <span className="invisible min-w-[1ch] overflow-hidden whitespace-pre text-clip pr-1">
                            {renameValue || " "}
                        </span>
                        <input
                            ref={renameInputRef}
                            type="text"
                            value={renameValue}
                            maxLength={MAX_WORKSPACE_TAB_NAME_LENGTH}
                            onBlur={handleRenameInputBlur}
                            onChange={handleRenameInputChange}
                            onKeyDown={handleRenameInputKeyDown}
                            aria-label={`Rename ${tab.fileName}`}
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
                <>
                    <button
                        ref={handleRef}
                        type="button"
                        onClick={() => onSelectTab(tab.id)}
                        role="tab"
                        aria-selected={isActive}
                        className={[
                            "app-select-none flex max-w-[15rem] cursor-grab items-center py-1.5 pl-3 pr-3 text-left text-[0.8125rem] font-semibold tracking-[0.01em] transition-[color,padding] duration-150 active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-2 focus-visible:ring-offset-fumi-100",
                            isTabDragActive
                                ? ""
                                : "group-hover:pr-7 group-focus-within:pr-7",
                            isActive
                                ? "text-fumi-600"
                                : isTabDragActive
                                  ? "text-fumi-500"
                                  : "text-fumi-500 hover:text-fumi-600",
                        ].join(" ")}
                    >
                        <span className="min-w-0 truncate">{baseName}</span>
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
                    <AppTooltip
                        content="Archive tab"
                        side="bottom"
                        shortcut={APP_HOTKEYS.ARCHIVE_WORKSPACE_TAB.label}
                    >
                        <button
                            type="button"
                            aria-label={`Archive ${tab.fileName}`}
                            onClick={(event) => {
                                event.stopPropagation();
                                onArchiveTab(tab.id);
                            }}
                            onDoubleClick={(event) => {
                                event.stopPropagation();
                            }}
                            className={[
                                "app-select-none pointer-events-none absolute right-0.5 top-1/2 inline-flex size-5 -translate-y-1/2 items-center justify-center rounded-full text-fumi-400 scale-95 opacity-0 transition-[opacity,transform,background-color,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-1 focus-visible:ring-offset-fumi-100",
                                isTabDragActive
                                    ? ""
                                    : "hover:bg-fumi-200 hover:text-fumi-600",
                                isTabDragActive
                                    ? ""
                                    : "group-hover:pointer-events-auto group-hover:scale-100 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:scale-100 group-focus-within:opacity-100",
                            ].join(" ")}
                        >
                            <AppIcon
                                icon={Cancel01Icon}
                                size={10}
                                strokeWidth={2.5}
                            />
                        </button>
                    </AppTooltip>
                </>
            )}
        </div>
    );
}
