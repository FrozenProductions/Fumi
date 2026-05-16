import { PinIcon } from "@hugeicons/core-free-icons";
import type { ReactElement } from "react";
import { joinClassNames } from "../../../lib/shared/className";
import { splitWorkspaceFileName } from "../../../lib/workspace/fileName";
import { AppIcon } from "../../app/common/AppIcon";
import type { WorkspaceTabListDropdownProps } from "./workspaceTabBar.type";

type WorkspaceTabListDropdownItemProps = {
    activeTabId: string | null;
    tab: WorkspaceTabListDropdownProps["workspace"]["tabs"][number];
    onClose: WorkspaceTabListDropdownProps["onClose"];
    onSelectTab: WorkspaceTabListDropdownProps["onSelectTab"];
};

/**
 * Renders a single tab item in the tab list dropdown menu.
 *
 * Displays the tab's file base name with indicators for pinned and dirty state.
 * Closes the dropdown and selects the tab when clicked.
 *
 * @param props - Component configuration
 * @param props.activeTabId - ID of the currently active tab
 * @param props.tab - The tab to display
 * @param props.onClose - Called to close the dropdown after selection
 * @param props.onSelectTab - Called when the tab is clicked
 * @returns A React component
 */
export function WorkspaceTabListDropdownItem({
    activeTabId,
    tab,
    onClose,
    onSelectTab,
}: WorkspaceTabListDropdownItemProps): ReactElement {
    const { baseName } = splitWorkspaceFileName(tab.fileName);
    const isActive = tab.id === activeTabId;
    const tabClassName = joinClassNames(
        "app-select-none flex h-8 w-full items-center justify-between gap-3 rounded-[var(--workspace-menu-item-radius)] px-2.5 text-left text-[11px] font-semibold tracking-wide transition-colors",
        isActive
            ? "bg-fumi-100 text-fumi-800"
            : "text-fumi-500 hover:bg-fumi-50 hover:text-fumi-800",
    );

    return (
        <button
            type="button"
            onClick={() => {
                onSelectTab(tab.id);
                onClose();
            }}
            className={tabClassName}
        >
            <span className="min-w-0 flex-1 truncate text-left">
                {baseName}
            </span>
            {tab.isPinned ? (
                <span className="shrink-0 text-fumi-400">
                    <AppIcon icon={PinIcon} size={10} strokeWidth={2.2} />
                </span>
            ) : null}
            {tab.isDirty ? (
                <span className="size-2 shrink-0 rounded-full bg-amber-500" />
            ) : null}
        </button>
    );
}
