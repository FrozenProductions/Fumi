import type { AppSidebarItem } from "../../lib/app/app.type";

export function showsWorkspaceContext(item: AppSidebarItem): boolean {
    return item === "workspace";
}
