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
import { APP_HOTKEYS } from "./hotkeys";

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
        shortcutLabel: APP_HOTKEYS.OPEN_WORKSPACE_SCREEN.label,
    },
    {
        id: "script-library",
        label: "Script Library",
        icon: BookCopyIcon,
        shortcutLabel: APP_HOTKEYS.OPEN_SCRIPT_LIBRARY.label,
    },
    {
        id: "accounts",
        label: "Accounts",
        icon: UserMultiple02Icon,
        shortcutLabel: APP_HOTKEYS.OPEN_ACCOUNTS.label,
    },
] satisfies AppSidebarNavigationItem[];

export const APP_SETTINGS_SIDEBAR_ITEM = {
    label: "Settings",
    icon: Settings01Icon,
    shortcutLabel: APP_HOTKEYS.OPEN_SETTINGS.label,
} satisfies AppSidebarActionItem;
