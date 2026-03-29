import { type MouseEvent, type ReactElement, useState } from "react";
import {
    APP_SETTINGS_SECTIONS,
    DEFAULT_APP_SETTINGS_SECTION,
} from "../../constants/app/settings";
import { usePresenceTransition } from "../../hooks/shared/usePresenceTransition";
import type { AppSettingsSection } from "../../types/app/settings";
import type { UseWorkspaceSessionResult } from "../../types/workspace/session";
import { AppSettingsEditorSection } from "./settings/AppSettingsEditorSection";
import { AppSettingsGeneralSection } from "./settings/AppSettingsGeneralSection";
import { AppSettingsWorkspaceSection } from "./settings/AppSettingsWorkspaceSection";

type AppSettingsWindowProps = {
    isOpen: boolean;
    onClose: () => void;
    workspaceSession: UseWorkspaceSessionResult;
};

const SETTINGS_WINDOW_EXIT_DURATION_MS = 220;

export function AppSettingsWindow({
    isOpen,
    onClose,
    workspaceSession,
}: AppSettingsWindowProps): ReactElement | null {
    const [activeSection, setActiveSection] = useState<AppSettingsSection>(
        DEFAULT_APP_SETTINGS_SECTION,
    );
    const { isPresent, isClosing } = usePresenceTransition({
        isOpen,
        exitDurationMs: SETTINGS_WINDOW_EXIT_DURATION_MS,
    });

    const renderSectionContent = (): ReactElement => {
        if (activeSection === "general") {
            return <AppSettingsGeneralSection />;
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

        return <AppSettingsGeneralSection />;
    };

    const handlePanelClick = (event: MouseEvent<HTMLElement>): void => {
        event.stopPropagation();
    };

    if (!isPresent) {
        return null;
    }

    const backdropMotionClassName = isClosing
        ? "motion-safe:motion-opacity-out-0 motion-safe:motion-duration-140 motion-safe:motion-ease-out-cubic"
        : "motion-safe:motion-opacity-in-0 motion-safe:motion-duration-100 motion-safe:motion-ease-out-cubic";
    const panelMotionClassName = isClosing
        ? "motion-safe:motion-opacity-out-0 motion-safe:motion-scale-out-[93%] motion-safe:motion-duration-190 motion-safe:motion-ease-in-quart"
        : "motion-safe:motion-opacity-in-0 motion-safe:motion-scale-in-[96%] motion-safe:motion-duration-170 motion-safe:motion-ease-spring-smooth";

    return (
        <div
            className={[
                "absolute inset-0 z-50 flex items-center justify-center p-6",
                isClosing ? "pointer-events-none" : "",
                backdropMotionClassName,
            ].join(" ")}
        >
            <button
                type="button"
                aria-label="Close settings"
                onClick={onClose}
                className="absolute inset-0"
            />
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="app-settings-title"
                onClick={handlePanelClick}
                className={[
                    "relative z-10 flex h-[min(36rem,calc(100%-3rem))] w-full max-w-3xl overflow-hidden rounded-[1.45rem] border border-fumi-200 bg-fumi-50 ring-1 ring-fumi-200 shadow-[var(--shadow-app-card)] motion-reduce:animate-none motion-reduce:transform-none",
                    panelMotionClassName,
                ].join(" ")}
            >
                <div className="flex w-48 shrink-0 flex-col border-r border-fumi-200 bg-fumi-100/80 p-4">
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
                                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold transition-[background-color,color,box-shadow] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-2 focus-visible:ring-offset-fumi-100 ${
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

                <div className="flex min-w-0 flex-1 flex-col overflow-auto bg-fumi-50 [&::-webkit-scrollbar-thumb:hover]:bg-[rgb(var(--color-scrollbar-thumb-hover)/1)] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-[rgb(var(--color-scrollbar-thumb)/1)] [&::-webkit-scrollbar-thumb]:bg-clip-padding [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:h-[6px] [&::-webkit-scrollbar]:w-[6px]">
                    <div className="flex flex-1 flex-col px-6 py-6">
                        {renderSectionContent()}
                    </div>
                </div>
            </section>
        </div>
    );
}
