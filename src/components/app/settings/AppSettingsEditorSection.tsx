import type { ReactElement } from "react";
import {
    APP_EDITOR_FONT_SIZE_MAX,
    APP_EDITOR_FONT_SIZE_MIN,
    APP_INTELLISENSE_PRIORITY_OPTIONS,
} from "../../../constants/app/settings";
import { useAppStore } from "../../../hooks/app/useAppStore";
import { AppInput } from "../AppInput";
import { AppSelect } from "../AppSelect";
import { AppSettingsToggle } from "../AppSettingsToggle";

export function AppSettingsEditorSection(): ReactElement {
    const editorSettings = useAppStore((state) => state.editorSettings);
    const setEditorFontSize = useAppStore((state) => state.setEditorFontSize);
    const setEditorIntellisenseEnabled = useAppStore(
        (state) => state.setEditorIntellisenseEnabled,
    );
    const setEditorIntellisensePriority = useAppStore(
        (state) => state.setEditorIntellisensePriority,
    );

    const handleFontSizeChange = (value: string): void => {
        setEditorFontSize(Number(value));
    };

    const handleIntellisenseToggle = (): void => {
        setEditorIntellisenseEnabled(!editorSettings.isIntellisenseEnabled);
    };

    const handleIntellisensePriorityChange = (
        value: (typeof APP_INTELLISENSE_PRIORITY_OPTIONS)[number]["value"],
    ): void => {
        setEditorIntellisensePriority(value);
    };

    return (
        <div className="flex w-full flex-col divide-y divide-fumi-200/80">
            <div className="flex items-center justify-between gap-6 py-4">
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-fumi-900">
                        Font size
                    </p>
                    <p className="mt-1 text-xs leading-[1.55] text-fumi-400">
                        Code editor text size across all workspace tabs.
                    </p>
                </div>
                <AppInput
                    value={String(editorSettings.fontSize)}
                    ariaLabel="Editor font size"
                    onChange={handleFontSizeChange}
                    minValue={APP_EDITOR_FONT_SIZE_MIN}
                    maxValue={APP_EDITOR_FONT_SIZE_MAX}
                    maxLength={2}
                    inputMode="numeric"
                    suffix="px"
                    className="shrink-0"
                />
            </div>
            <AppSettingsToggle
                label="IntelliSense"
                description="Show Luau completion suggestions while typing."
                isEnabled={editorSettings.isIntellisenseEnabled}
                onChange={handleIntellisenseToggle}
            >
                <div className="flex items-start justify-between gap-4 rounded-[0.95rem] border border-fumi-200/80 bg-fumi-100/70 px-3.5 py-3.5">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="mt-px size-1.5 shrink-0 rounded-full bg-fumi-500" />
                            <p className="text-[11px] font-semibold tracking-[0.01em] text-fumi-800">
                                Suggestion Priority
                            </p>
                        </div>
                        <p className="mt-1.5 text-xs leading-[1.55] text-fumi-400">
                            Prefer Luau and Roblox docs, executor APIs, or keep
                            a balanced mix when suggestions overlap.
                        </p>
                    </div>
                    <AppSelect
                        value={editorSettings.intellisensePriority}
                        options={APP_INTELLISENSE_PRIORITY_OPTIONS}
                        onChange={handleIntellisensePriorityChange}
                        className="mt-0.5 shrink-0"
                    />
                </div>
            </AppSettingsToggle>
        </div>
    );
}
