import type { WorkspaceSession } from "../../lib/workspace/workspace.type";

export function reorderTabPreview(
    tabs: WorkspaceSession["tabs"],
    draggedTabId: string,
    targetTabId: string,
): WorkspaceSession["tabs"] {
    if (draggedTabId === targetTabId) {
        return tabs;
    }

    const draggedTabIndex = tabs.findIndex((tab) => tab.id === draggedTabId);
    const targetTabIndex = tabs.findIndex((tab) => tab.id === targetTabId);

    if (draggedTabIndex < 0 || targetTabIndex < 0) {
        return tabs;
    }

    const nextTabs = [...tabs];
    const [draggedTab] = nextTabs.splice(draggedTabIndex, 1);

    if (!draggedTab) {
        return tabs;
    }

    nextTabs.splice(targetTabIndex, 0, draggedTab);
    return nextTabs;
}
