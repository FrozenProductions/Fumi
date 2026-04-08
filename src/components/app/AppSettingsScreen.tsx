import { type ReactElement, useState } from "react";
import {
    APP_SETTINGS_SECTIONS,
    DEFAULT_APP_SETTINGS_SECTION,
} from "../../constants/app/settings";
import type { AppSettingsSection } from "../../lib/app/app.type";
import { AppSettingsEditorSection } from "./settings/AppSettingsEditorSection";
import { AppSettingsGeneralSection } from "./settings/AppSettingsGeneralSection";
import { AppSettingsHotkeysSection } from "./settings/AppSettingsHotkeysSection";
import { AppSettingsWorkspaceSection } from "./settings/AppSettingsWorkspaceSection";
import type { AppSettingsScreenProps } from "./settings/appSettings.type";

export function AppSettingsScreen({
    updater,
    workspaceSession,
}: AppSettingsScreenProps): ReactElement {
    const [activeSection, setActiveSection] = useState<AppSettingsSection>(
        DEFAULT_APP_SETTINGS_SECTION,
    );

    const renderSectionContent = (): ReactElement => {
        if (activeSection === "general") {
            return <AppSettingsGeneralSection updater={updater} />;
        }

        if (activeSection === "workspace") {
            return (
                <AppSettingsWorkspaceSection
                    workspaceSession={workspaceSession}
                />
            );
        }

        if (activeSection === "editor") {
            return <AppSettingsEditorSection />;
        }

        if (activeSection === "hotkeys") {
            return <AppSettingsHotkeysSection />;
        }

        return <AppSettingsGeneralSection updater={updater} />;
    };

    return (
        <div className="flex h-full w-full flex-col overflow-hidden bg-fumi-50">
            <div className="flex flex-1 overflow-hidden">
                <div className="flex w-64 shrink-0 flex-col border-r border-fumi-200 bg-fumi-100/80 p-4">
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
                        {APP_SETTINGS_SECTIONS.map(({ id, label }) => {
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
                    <div className="flex max-w-4xl flex-1 flex-col px-10 py-2.5">
                        {renderSectionContent()}
                    </div>
                </div>
            </div>
        </div>
    );
}
