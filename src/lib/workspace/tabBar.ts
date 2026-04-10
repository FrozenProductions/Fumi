import { PointerActivationConstraints } from "@dnd-kit/dom";
import { PointerSensor } from "@dnd-kit/react";
import type { WorkspaceSession } from "../../lib/workspace/workspace.type";

export const TAB_BAR_MODIFIERS: never[] = [];

export const TAB_BAR_SENSORS = [
    PointerSensor.configure({
        activationConstraints: [
            new PointerActivationConstraints.Distance({
                value: 6,
            }),
        ],
    }),
];

export const TAB_BAR_SORTABLE_GROUP = "workspace-tabs";

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
