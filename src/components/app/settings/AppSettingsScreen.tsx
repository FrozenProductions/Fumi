import type { ReactElement } from "react";
import { useState } from "react";
import {
    APP_SETTINGS_SECTIONS,
    DEFAULT_APP_SETTINGS_SECTION,
} from "../../../constants/app/settings";
import type { AppSettingsSection } from "../../../lib/app/app.type";
import { isDevRuntime } from "../../../lib/platform/runtime";
import { AppSettingsDevSection } from "./AppSettingsDevSection";
import { AppSettingsEditorSection } from "./AppSettingsEditorSection";
import { AppSettingsGeneralSection } from "./AppSettingsGeneralSection";
import { AppSettingsHotkeysSection } from "./AppSettingsHotkeysSection";
import { AppSettingsWorkspaceSection } from "./AppSettingsWorkspaceSection";
import type { AppSettingsScreenProps } from "./appSettings.type";

/**
 * The settings screen with section navigation and content panels.
 *
 * @param props - Component props
 * @param props.updater - App update state and handlers
 * @param props.workspaceSession - Current workspace session info
 * @returns A React component
 */
export function AppSettingsScreen({
    updater,
}: AppSettingsScreenProps): ReactElement {
    const isDevelopmentRuntime = isDevRuntime();
    const [activeSection, setActiveSection] = useState<AppSettingsSection>(
        DEFAULT_APP_SETTINGS_SECTION,
    );
    const visibleSections = APP_SETTINGS_SECTIONS.filter(
        ({ id }) => id !== "dev" || isDevelopmentRuntime,
    );

    const renderSectionContent = (): ReactElement => {
        if (activeSection === "general") {
            return <AppSettingsGeneralSection updater={updater} />;
        }

        if (activeSection === "workspace") {
            return <AppSettingsWorkspaceSection />;
        }

        if (activeSection === "editor") {
            return <AppSettingsEditorSection />;
        }

        if (activeSection === "hotkeys") {
            return <AppSettingsHotkeysSection />;
        }

        if (activeSection === "dev" && isDevelopmentRuntime) {
            return <AppSettingsDevSection />;
        }

        return <AppSettingsGeneralSection updater={updater} />;
    };

    return (
        <div className="flex h-full w-full flex-col overflow-hidden bg-fumi-50">
            <div className="flex flex-1 overflow-hidden">
                <div className="flex w-56 shrink-0 flex-col border-r border-fumi-200 bg-fumi-100/80 p-4">
                    <div className="px-2 pb-4 pt-2">
                        <h2
                            id="app-settings-title"
                            className="text-[15px] font-semibold tracking-[-0.02em] text-fumi-900"
                        >
                            Settings
                        </h2>
                    </div>
                    <nav
                        aria-label="Settings sections"
                        className="flex flex-1 flex-col gap-0.5"
                    >
                        {visibleSections.map(({ id, label }) => {
                            const isActive = activeSection === id;

                            return (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => setActiveSection(id)}
                                    className={`app-select-none flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold transition-[background-color,color,box-shadow] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-2 focus-visible:ring-offset-fumi-100 ${
                                        isActive
                                            ? "bg-fumi-50 text-fumi-900 shadow-sm ring-1 ring-fumi-200"
                                            : "text-fumi-500 hover:bg-fumi-200 hover:text-fumi-800"
                                    }`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                <div className="flex min-w-0 flex-1 flex-col overflow-auto bg-fumi-50 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-10 py-2.5">
                        {renderSectionContent()}
                    </div>
                </div>
            </div>
        </div>
    );
}
