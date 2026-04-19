import type { ReactElement } from "react";
import {
    WORKSPACE_TAB_LIST_DROPDOWN_STYLE,
    WORKSPACE_TAB_LIST_DROPDOWN_VIEWPORT_STYLE,
} from "../../../constants/workspace/workspace";
import { splitWorkspaceFileName } from "../../../lib/workspace/fileName";
import type { WorkspaceTabListDropdownProps } from "./workspaceTabBar.type";

/**
 * Dropdown showing all workspace tabs for quick selection.
 *
 * @param props - Component props
 * @param props.workspace - The workspace data
 * @param props.onSelectTab - Select a tab
 * @param props.onClose - Close the dropdown
 * @returns A React component
 */
export function WorkspaceTabListDropdown({
    workspace,
    onClose,
    onSelectTab,
}: WorkspaceTabListDropdownProps): ReactElement {
    return (
        <div
            style={WORKSPACE_TAB_LIST_DROPDOWN_STYLE}
            className="absolute right-0 top-[calc(100%+0.25rem)] z-50 min-w-[140px] max-w-[200px] origin-top-right overflow-hidden rounded-[var(--workspace-menu-radius)] border border-fumi-200 bg-fumi-50 shadow-[var(--shadow-app-floating)] animate-fade-in"
        >
            <div
                style={WORKSPACE_TAB_LIST_DROPDOWN_VIEWPORT_STYLE}
                className="overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {workspace.tabs.map((tab) => {
                    const { baseName } = splitWorkspaceFileName(tab.fileName);
                    const isActive = tab.id === workspace.activeTabId;
                    const isDirty = tab.content !== tab.savedContent;

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => {
                                onSelectTab(tab.id);
                                onClose();
                            }}
                            className={[
                                "app-select-none flex h-8 w-full items-center justify-between gap-3 rounded-[calc(var(--workspace-menu-radius)-var(--workspace-menu-inset))] px-2.5 text-left text-[11px] font-semibold tracking-wide transition-colors",
                                isActive
                                    ? "bg-fumi-100 text-fumi-800"
                                    : "text-fumi-500 hover:bg-fumi-50 hover:text-fumi-800",
                            ].join(" ")}
                        >
                            <span className="min-w-0 flex-1 truncate text-left">
                                {baseName}
                            </span>
                            {isDirty ? (
                                <span className="size-2 shrink-0 rounded-full bg-amber-500" />
                            ) : null}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
