import type { AppSidebarItem } from "./sidebar.type";

/**
 * Determines whether the given sidebar item should display the workspace context.
 *
 * @param item - The sidebar item to check
 * @returns True if the item is the workspace tab
 */
export function showsWorkspaceContext(item: AppSidebarItem): boolean {
    return item === "workspace";
}
