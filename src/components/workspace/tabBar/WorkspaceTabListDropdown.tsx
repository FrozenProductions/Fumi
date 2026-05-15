import type { ReactElement } from "react";
import {
    WORKSPACE_TAB_LIST_DROPDOWN_STYLE,
    WORKSPACE_TAB_LIST_DROPDOWN_VIEWPORT_STYLE,
} from "../../../constants/workspace/workspace";
import { WorkspaceTabListDropdownItem } from "./WorkspaceTabListDropdownItem";
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
                {workspace.tabs.map((tab) => (
                    <WorkspaceTabListDropdownItem
                        key={tab.id}
                        activeTabId={workspace.activeTabId}
                        tab={tab}
                        onClose={onClose}
                        onSelectTab={onSelectTab}
                    />
                ))}
            </div>
        </div>
    );
}
