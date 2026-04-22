import type { CSSProperties, ReactElement } from "react";
import {
    APP_SETTINGS_SIDEBAR_ITEM,
    APP_SIDEBAR_ITEMS,
} from "../../constants/app/sidebar";
import { useAppStore } from "../../hooks/app/useAppStore";
import { getAppHotkeyShortcutLabel } from "../../lib/app/hotkeys";
import { AppIcon } from "./AppIcon";
import { AppTooltip } from "./AppTooltip";
import type { AppSidebarProps } from "./appShell.type";

/**
 * The sidebar navigation panel providing access to main app sections.
 *
 * @param props - Component props
 * @param props.isOpen - Whether the sidebar is expanded
 * @param props.position - Which side the sidebar is anchored to
 * @param props.activeItem - Currently selected sidebar item ID
 * @param props.showsSettingsUpdateIndicator - Show indicator on settings icon
 * @param props.onSelectItem - Callback when a sidebar item is selected
 * @returns A React component
 */
export function AppSidebar({
    isOpen,
    position,
    activeItem,
    showsSettingsUpdateIndicator,
    onSelectItem,
}: AppSidebarProps): ReactElement {
    const hotkeyBindings = useAppStore((state) => state.hotkeyBindings);
    const activeIndex = APP_SIDEBAR_ITEMS.findIndex(
        (item) => item.id === activeItem,
    );
    const activeIndicatorOffset = Math.max(0, activeIndex) * 48;
    const isNavigationItemActive = activeIndex !== -1;
    const settingsIcon = APP_SETTINGS_SIDEBAR_ITEM.icon;
    const shortcutLabels = {
        workspace: getAppHotkeyShortcutLabel(
            "OPEN_WORKSPACE_SCREEN",
            hotkeyBindings,
        ),
        "automatic-execution": getAppHotkeyShortcutLabel(
            "OPEN_AUTOMATIC_EXECUTION",
            hotkeyBindings,
        ),
        "script-library": getAppHotkeyShortcutLabel(
            "OPEN_SCRIPT_LIBRARY",
            hotkeyBindings,
        ),
        accounts: getAppHotkeyShortcutLabel("OPEN_ACCOUNTS", hotkeyBindings),
        settings: getAppHotkeyShortcutLabel("OPEN_SETTINGS", hotkeyBindings),
    } as const;

    const borderClass =
        position === "left"
            ? "border-r border-fumi-200"
            : "border-l border-fumi-200";
    const tooltipSide = position === "left" ? "right" : "left";
    const activeIndicatorStyle = {
        transform: `translateY(${activeIndicatorOffset}px) scale(${
            isNavigationItemActive ? 1 : 0.95
        })`,
    } satisfies CSSProperties;
    const activeRailStyle = {
        transform: `translateY(${activeIndicatorOffset + 10}px)`,
    } satisfies CSSProperties;
    const getTooltipLabel = (
        id: (typeof APP_SIDEBAR_ITEMS)[number]["id"],
        label: string,
    ): string => {
        return id === "accounts" ? "Accounts Manager" : label;
    };

    return (
        <aside
            className={`app-select-none relative z-40 shrink-0 overflow-hidden bg-fumi-100 transition-[width,border-color] duration-300 ease-in-out ${
                isOpen ? `w-14 ${borderClass}` : "w-0 border-transparent"
            }`}
        >
            <div className="flex h-full w-14 flex-col items-center justify-between py-3">
                <div
                    className={`relative flex w-10 flex-col gap-2 transition-[opacity,transform] duration-300 ease-in-out ${
                        isOpen
                            ? "translate-x-0 opacity-100"
                            : "-translate-x-2 opacity-0 pointer-events-none"
                    }`}
                >
                    <div
                        className={`absolute left-0 top-0 h-10 w-10 rounded-[0.65rem] bg-fumi-50 shadow-sm ring-1 ring-fumi-200 transition-[transform,opacity] duration-300 ease-in-out ${
                            isNavigationItemActive ? "opacity-100" : "opacity-0"
                        }`}
                        style={activeIndicatorStyle}
                    />
                    <div
                        className={`absolute top-0 h-5 w-1 bg-fumi-600 transition-[transform,opacity] duration-300 ease-in-out ${
                            position === "left"
                                ? "left-0 rounded-r-full"
                                : "right-0 rounded-l-full"
                        } ${isNavigationItemActive ? "opacity-100" : "opacity-0"}`}
                        style={activeRailStyle}
                    />

                    {APP_SIDEBAR_ITEMS.map(({ id, label, icon }) => {
                        const isActive = activeItem === id;
                        const tooltipLabel = getTooltipLabel(id, label);
                        return (
                            <AppTooltip
                                key={id}
                                content={tooltipLabel}
                                side={tooltipSide}
                                shortcut={shortcutLabels[id]}
                            >
                                <button
                                    type="button"
                                    aria-label={label}
                                    aria-pressed={isActive}
                                    onClick={() => onSelectItem(id)}
                                    className={`group relative z-10 flex size-10 items-center justify-center rounded-[0.65rem] transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-2 focus-visible:ring-offset-fumi-100 ${
                                        isActive
                                            ? "text-fumi-600"
                                            : "bg-transparent text-fumi-400 hover:bg-fumi-200 hover:text-fumi-600"
                                    }`}
                                >
                                    <AppIcon
                                        aria-hidden="true"
                                        icon={icon}
                                        className="block size-[1.2rem] [-webkit-user-drag:none]"
                                        strokeWidth={isActive ? 2.5 : 2}
                                    />
                                </button>
                            </AppTooltip>
                        );
                    })}
                </div>

                <div
                    className={`transition-[opacity,transform] duration-300 ease-in-out ${
                        isOpen
                            ? "translate-x-0 opacity-100"
                            : "-translate-x-2 opacity-0 pointer-events-none"
                    }`}
                >
                    <AppTooltip
                        content={APP_SETTINGS_SIDEBAR_ITEM.label}
                        side={tooltipSide}
                        shortcut={shortcutLabels.settings}
                    >
                        <button
                            type="button"
                            aria-label={APP_SETTINGS_SIDEBAR_ITEM.label}
                            aria-pressed={activeItem === "settings"}
                            onClick={() => onSelectItem("settings")}
                            className={`group relative z-10 flex size-10 items-center justify-center rounded-[0.65rem] transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-2 focus-visible:ring-offset-fumi-100 ${
                                activeItem === "settings"
                                    ? "bg-fumi-50 text-fumi-600 shadow-sm ring-1 ring-fumi-200"
                                    : "bg-transparent text-fumi-400 hover:bg-fumi-200 hover:text-fumi-600"
                            }`}
                        >
                            <AppIcon
                                aria-hidden="true"
                                icon={settingsIcon}
                                className="block size-[1.2rem] [-webkit-user-drag:none]"
                                strokeWidth={
                                    activeItem === "settings" ? 2.5 : 2
                                }
                            />
                            {showsSettingsUpdateIndicator ? (
                                <span className="pointer-events-none absolute right-[0.42rem] top-[0.42rem] size-1.5 rounded-full bg-fumi-600" />
                            ) : null}
                        </button>
                    </AppTooltip>
                </div>
            </div>
        </aside>
    );
}
