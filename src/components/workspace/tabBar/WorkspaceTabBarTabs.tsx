import type { ReactElement } from "react";
import { TAB_BAR_SORTABLE_GROUP } from "../../../constants/workspace/workspace";
import { WorkspaceTabItem } from "./WorkspaceTabItem";
import type { WorkspaceTabBarTabsProps } from "./workspaceTabBar.type";

/**
 * Renders the single-pane and split-pane tab strip layouts.
 *
 * @param props - Component props
 * @param props.layout - Layout configuration for tabs, split view, and styling
 * @param props.items - Shared tab item state and action callbacks
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

    if (layout.isSplit && layout.secondaryTabs.length > 0 && layout.splitView) {
        const splitView = layout.splitView;

        return (
            <div className="relative flex items-stretch">
                <div
                    style={layout.primarySectionStyle}
                    className="min-w-0 flex items-center gap-2 overflow-x-auto overflow-y-hidden px-2 py-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                    {layout.primaryTabs.map((tab, index) => {
                        const item = {
                            index,
                            sortableGroup: TAB_BAR_SORTABLE_GROUP,
                            tab,
                        };
                        const state = {
                            ...sharedTabItemState,
                            isActive: tab.id === layout.activeTabId,
                            isVisibleInSplit: splitView.primaryTabId === tab.id,
                        };
                        const actions = {
                            ...sharedTabItemActions,
                            onSelectTab: (id: string): void => {
                                items.onOpenTabInPane(id, "primary");
                            },
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

                <div
                    style={layout.dividerStyle}
                    className={layout.splitDividerClassName}
                />

                <div
                    style={layout.secondarySectionStyle}
                    className={layout.secondaryTabsClassName}
                >
                    {layout.secondaryTabs.map((tab, secondaryIndex) => {
                        const item = {
                            index: layout.primaryTabs.length + secondaryIndex,
                            sortableGroup: TAB_BAR_SORTABLE_GROUP,
                            tab,
                        };
                        const state = {
                            ...sharedTabItemState,
                            isActive: tab.id === layout.activeTabId,
                            isVisibleInSplit: tab.id === layout.secondaryTabId,
                        };
                        const actions = {
                            ...sharedTabItemActions,
                            onSelectTab: (id: string): void => {
                                items.onOpenTabInPane(id, "secondary");
                            },
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
            </div>
        );
    }

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
