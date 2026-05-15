import type { ReactElement } from "react";
import { TAB_BAR_SORTABLE_GROUP } from "../../../constants/workspace/workspace";
import { WorkspaceTabItem } from "./WorkspaceTabItem";
import type { WorkspaceTabBarTabsProps } from "./workspaceTabBar.type";

/**
 * Renders workspace tabs for a single pane.
 */
export function WorkspaceTabBarTabs({
    layout,
    items,
}: WorkspaceTabBarTabsProps): ReactElement {
    const sharedTabItemState = {
        isTabDragActive: items.isTabDragActive,
    } as const;
    const sharedTabItemActions = {
        middleClickTabAction: items.middleClickTabAction,
        onOpenContextMenu: items.onOpenContextMenu,
        onArchiveTab: items.onArchiveTab,
        onDeleteTab: items.onDeleteTab,
    } as const;

    return (
        <div className={layout.singlePaneTabsClassName}>
            {layout.primaryTabs.map((tab, index) => {
                const item = {
                    index,
                    sortableGroup: TAB_BAR_SORTABLE_GROUP,
                    tab,
                };
                const state = {
                    ...sharedTabItemState,
                    isActive: tab.id === layout.activeTabId,
                    isVisibleInSplit: false,
                };
                const actions = {
                    ...sharedTabItemActions,
                    onSelectTab: items.onSelectTab,
                };

                return (
                    <WorkspaceTabItem
                        key={tab.id}
                        item={item}
                        state={state}
                        actions={actions}
                        rename={items.rename}
                    />
                );
            })}
        </div>
    );
}
