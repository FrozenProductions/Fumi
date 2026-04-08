import {
    BookCopyIcon,
    FolderCodeIcon,
    Settings01Icon,
    UserMultiple02Icon,
} from "@hugeicons/core-free-icons";
import type {
    AppSidebarActionItem,
    AppSidebarItem,
    AppSidebarNavigationItem,
} from "../../lib/app/app.type";

export const APP_SIDEBAR_ITEM_IDS = [
    "workspace",
    "script-library",
    "accounts",
    "settings",
] as const satisfies AppSidebarItem[];

export const APP_SIDEBAR_ITEMS = [
    {
        id: "workspace",
        label: "Workspace",
        icon: FolderCodeIcon,
    },
    {
        id: "script-library",
        label: "Script Library",
        icon: BookCopyIcon,
    },
    {
        id: "accounts",
        label: "Accounts",
        icon: UserMultiple02Icon,
    },
] satisfies AppSidebarNavigationItem[];

export const APP_SETTINGS_SIDEBAR_ITEM = {
    label: "Settings",
    icon: Settings01Icon,
} satisfies AppSidebarActionItem;
