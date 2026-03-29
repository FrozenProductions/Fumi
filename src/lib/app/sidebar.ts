import type { AppSidebarItem } from "../../types/app/sidebar";

export function showsWorkspaceContext(item: AppSidebarItem): boolean {
    return item === "workspace";
}
