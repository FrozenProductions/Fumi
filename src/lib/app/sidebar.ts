import type { AppSidebarItem } from "./app.type";

export function showsWorkspaceContext(item: AppSidebarItem): boolean {
    return item === "workspace";
}
