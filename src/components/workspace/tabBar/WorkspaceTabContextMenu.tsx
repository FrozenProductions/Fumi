import type { CSSProperties, ReactElement } from "react";
import { useEffect, useRef } from "react";
import { WORKSPACE_TAB_CONTEXT_MENU_EXIT_DURATION_MS } from "../../../constants/workspace/workspace";
import { useAppStore } from "../../../hooks/app/useAppStore";
import { usePresenceTransition } from "../../../hooks/shared/usePresenceTransition";
import { joinClassNames } from "../../../lib/shared/className";
import type { WorkspaceTabContextMenuProps } from "./workspaceTabBar.type";

function WorkspaceTabContextMenuDivider(): ReactElement {
    return <hr className="mx-2 my-0.5 h-px shrink-0 border-0 bg-fumi-200" />;
}

/**
 * Context menu for workspace tab actions (rename, duplicate, archive, delete).
 *
 * @param props - Component props
 * @param props.isOpen - Whether the menu is visible
 * @param props.position - Menu position
 * @param props.splitView - Current split view if any
 * @param props.canArchiveOtherTabs - Whether other open tabs can be archived
 * @param props.isPinned - Whether the tab is pinned
 * @param props.onDuplicate - Duplicate the tab
 * @param props.onArchive - Archive the tab
 * @param props.onArchiveAll - Archive all open tabs
 * @param props.onArchiveOther - Archive every open tab except this tab
 * @param props.onTogglePinned - Pin or unpin the tab
 * @param props.onDelete - Delete the tab
 * @param props.onRename - Start rename
 * @returns A React component or null
 */
export function WorkspaceTabContextMenu({
    isOpen,
    position,
    splitView,
    canArchiveOtherTabs,
    isPinned,
    onDuplicate,
    onArchive,
    onArchiveAll,
    onArchiveOther,
    onTogglePinned,
    onClose,
    onDelete,
    onRename,
    onSplitLeft,
    onSplitRight,
    onSplitTop,
    onSplitBottom,
    onCloseSplitView,
}: WorkspaceTabContextMenuProps): ReactElement | null {
    const theme = useAppStore((state) => state.theme);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const lastPositionRef = useRef(position);
    const { isPresent, isClosing } = usePresenceTransition({
        isOpen,
        exitDurationMs: WORKSPACE_TAB_CONTEXT_MENU_EXIT_DURATION_MS,
    });

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        lastPositionRef.current = position;
    }, [isOpen, position]);

    useEffect(() => {
        if (!isPresent) {
            return;
        }

        const handlePointerDown = (event: MouseEvent): void => {
            if (menuRef.current?.contains(event.target as Node) ?? false) {
                return;
            }

            onClose();
        };

        const handleKeyDown = (event: KeyboardEvent): void => {
            if (event.key !== "Escape") {
                return;
            }

            onClose();
        };

        document.addEventListener("mousedown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isPresent, onClose]);

    if (!isPresent) {
        return null;
    }

    const renderedPosition = isOpen ? position : lastPositionRef.current;
    const style = {
        left: Math.max(0, renderedPosition.x),
        top: Math.max(0, renderedPosition.y),
    } satisfies CSSProperties;
    const dropdownMotionClassName = isClosing
        ? "motion-safe:motion-opacity-out-0 motion-safe:motion-scale-out-[96%] motion-safe:-motion-translate-y-out-[4%] motion-safe:motion-duration-120 motion-safe:motion-ease-in-quad"
        : "motion-safe:motion-opacity-in-0 motion-safe:motion-scale-in-[96%] motion-safe:-motion-translate-y-in-[6%] motion-safe:motion-duration-150 motion-safe:motion-ease-spring-snappy";
    const menuItemClassName =
        "app-select-none flex h-7 w-full items-center justify-between gap-2 rounded-md px-2 text-left text-[10px] font-semibold tracking-wide text-fumi-500 transition-colors hover:bg-fumi-100 hover:text-fumi-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-1 focus-visible:ring-offset-fumi-50";
    const disabledMenuItemClassName =
        "app-select-none flex h-7 w-full cursor-not-allowed items-center justify-between gap-2 rounded-md px-2 text-left text-[10px] font-semibold tracking-wide text-fumi-300";
    const deleteButtonClassName =
        theme === "dark"
            ? "app-select-none flex h-7 w-full items-center justify-between gap-2 rounded-md px-2 text-left text-[10px] font-semibold tracking-wide text-rose-200 transition-colors hover:bg-rose-950/70 hover:text-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1 focus-visible:ring-offset-fumi-50"
            : "app-select-none flex h-7 w-full items-center justify-between gap-2 rounded-md px-2 text-left text-[10px] font-semibold tracking-wide text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1 focus-visible:ring-offset-fumi-50";
    const menuClassName = joinClassNames(
        "absolute z-50 min-w-[148px] origin-top-left overflow-hidden rounded-[0.7rem] border border-fumi-200 bg-fumi-50 p-1 shadow-[var(--shadow-app-floating)] motion-reduce:animate-none motion-reduce:transform-none",
        isClosing && "pointer-events-none",
        dropdownMotionClassName,
    );

    return (
        <div
            ref={menuRef}
            style={style}
            className={menuClassName}
            data-tab-context-menu
            role="menu"
            aria-label="Tab actions"
        >
            <button
                type="button"
                role="menuitem"
                onClick={() => {
                    onRename();
                    onClose();
                }}
                className={menuItemClassName}
            >
                Rename
            </button>
            <button
                type="button"
                role="menuitem"
                onClick={() => {
                    onDuplicate();
                    onClose();
                }}
                className={menuItemClassName}
            >
                Duplicate
            </button>
            <WorkspaceTabContextMenuDivider />
            <button
                type="button"
                role="menuitem"
                onClick={() => {
                    if (!isPinned) {
                        onArchive();
                    }
                    onClose();
                }}
                disabled={isPinned}
                className={
                    isPinned ? disabledMenuItemClassName : menuItemClassName
                }
            >
                Archive
            </button>
            <button
                type="button"
                role="menuitem"
                onClick={() => {
                    onArchiveAll();
                    onClose();
                }}
                className={menuItemClassName}
            >
                Archive all
            </button>
            <button
                type="button"
                role="menuitem"
                onClick={() => {
                    onArchiveOther();
                    onClose();
                }}
                disabled={!canArchiveOtherTabs}
                className={
                    canArchiveOtherTabs
                        ? menuItemClassName
                        : disabledMenuItemClassName
                }
            >
                Archive other tabs
            </button>
            <WorkspaceTabContextMenuDivider />
            <button
                type="button"
                role="menuitem"
                onClick={() => {
                    onTogglePinned();
                    onClose();
                }}
                className={menuItemClassName}
            >
                {isPinned ? "Unpin tab" : "Pin tab"}
            </button>
            <WorkspaceTabContextMenuDivider />
            <button
                type="button"
                role="menuitem"
                onClick={() => {
                    onSplitLeft();
                    onClose();
                }}
                className={menuItemClassName}
            >
                Split left
            </button>
            <button
                type="button"
                role="menuitem"
                onClick={() => {
                    onSplitRight();
                    onClose();
                }}
                className={menuItemClassName}
            >
                Split right
            </button>
            <button
                type="button"
                role="menuitem"
                onClick={() => {
                    onSplitTop();
                    onClose();
                }}
                className={menuItemClassName}
            >
                Split top
            </button>
            <button
                type="button"
                role="menuitem"
                onClick={() => {
                    onSplitBottom();
                    onClose();
                }}
                className={menuItemClassName}
            >
                Split bottom
            </button>
            {splitView ? (
                <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                        onCloseSplitView();
                        onClose();
                    }}
                    className={menuItemClassName}
                >
                    Close split view
                </button>
            ) : null}
            <WorkspaceTabContextMenuDivider />
            <button
                type="button"
                role="menuitem"
                onClick={() => {
                    onDelete();
                    onClose();
                }}
                className={deleteButtonClassName}
            >
                Delete
            </button>
        </div>
    );
}
