import type { ReactElement } from "react";
import {
    APP_SETTINGS_SIDEBAR_ITEM,
    APP_SIDEBAR_ITEMS,
} from "../../constants/app/sidebar";
import { AppIcon } from "./AppIcon";
import { AppTooltip } from "./AppTooltip";
import type { AppSidebarProps } from "./appShell.type";

export function AppSidebar({
    isOpen,
    activeItem,
    showsSettingsUpdateIndicator,
    onSelectItem,
}: AppSidebarProps): ReactElement {
    const activeIndex = APP_SIDEBAR_ITEMS.findIndex(
        (item) => item.id === activeItem,
    );
    const activeIndicatorOffset = Math.max(0, activeIndex) * 48;
    const isNavigationItemActive = activeIndex !== -1;
    const settingsIcon = APP_SETTINGS_SIDEBAR_ITEM.icon;

    return (
        <aside
            className={`app-select-none relative z-40 shrink-0 overflow-hidden bg-fumi-100 transition-[width,border-color] duration-300 ease-in-out ${
                isOpen
                    ? "w-14 border-r border-fumi-200"
                    : "w-0 border-r border-transparent"
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
                        style={{
                            transform: `translateY(${activeIndicatorOffset}px) scale(${
                                isNavigationItemActive ? 1 : 0.95
                            })`,
                        }}
                    />
                    <div
                        className={`absolute left-0 top-0 h-5 w-1 rounded-r-full bg-fumi-600 transition-[transform,opacity] duration-300 ease-in-out ${
                            isNavigationItemActive ? "opacity-100" : "opacity-0"
                        }`}
                        style={{
                            transform: `translateY(${activeIndicatorOffset + 10}px)`,
                        }}
                    />

                    {APP_SIDEBAR_ITEMS.map(
                        ({ id, label, icon, shortcutLabel }) => {
                            const isActive = activeItem === id;
                            return (
                                <AppTooltip
                                    key={id}
                                    content={label}
                                    side="right"
                                    shortcut={shortcutLabel}
                                    disabled={!shortcutLabel}
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
                        },
                    )}
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
                        side="right"
                        shortcut={APP_SETTINGS_SIDEBAR_ITEM.shortcutLabel}
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
