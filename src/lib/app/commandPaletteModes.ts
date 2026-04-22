import { CommandIcon } from "@hugeicons/core-free-icons";
import type { AppCommandPaletteItem } from "../../lib/app/app.type";
import type {
    GetGoToLineCommandPaletteItemsOptions,
    GetThemeCommandPaletteItemsOptions,
} from "./commandPalette.type";

export function getGoToLineCommandPaletteItems({
    activeTab,
    goToLineNumber,
    onGoToLine,
}: GetGoToLineCommandPaletteItemsOptions): AppCommandPaletteItem[] {
    if (!activeTab) {
        return [];
    }

    return [
        {
            id: "command-goto-line",
            label:
                goToLineNumber === null
                    ? "Go to line"
                    : `Go to line ${goToLineNumber}`,
            description:
                goToLineNumber === null
                    ? `Type a line number for ${activeTab.fileName}.`
                    : `Jump within ${activeTab.fileName}.`,
            icon: CommandIcon,
            keywords: `goto go to jump line ${activeTab.fileName}`,
            isDisabled: goToLineNumber === null,
            onSelect: () => {
                if (goToLineNumber === null) {
                    return;
                }

                onGoToLine(goToLineNumber);
            },
        },
    ];
}

export function getThemeCommandPaletteItems({
    currentTheme,
    onSetTheme,
}: GetThemeCommandPaletteItemsOptions): AppCommandPaletteItem[] {
    const themeOptions: Array<{
        id: string;
        label: string;
        value: "light" | "dark" | "system";
        description: string;
        keywords: string;
    }> = [
        {
            id: "command-theme-light",
            label: "Light",
            value: "light",
            description: "Use the light color scheme.",
            keywords: "theme light",
        },
        {
            id: "command-theme-dark",
            label: "Dark",
            value: "dark",
            description: "Use the dark color scheme.",
            keywords: "theme dark",
        },
        {
            id: "command-theme-system",
            label: "System",
            value: "system",
            description: "Follow the system appearance.",
            keywords: "theme system auto",
        },
    ];

    return themeOptions.map((option) => ({
        id: option.id,
        label: option.label,
        description: option.description,
        icon: CommandIcon,
        meta: currentTheme === option.value ? "Current" : undefined,
        keywords: option.keywords,
        isDisabled: currentTheme === option.value,
        onSelect: () => {
            onSetTheme(option.value);
        },
    }));
}
