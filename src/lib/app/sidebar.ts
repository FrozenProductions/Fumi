import type { AppSidebarItem } from "./sidebar.type";

export function showsWorkspaceContext(item: AppSidebarItem): boolean {
    return item === "workspace";
}
