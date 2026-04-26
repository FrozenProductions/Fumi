import { CommandIcon } from "@hugeicons/core-free-icons";
import type {
    GetAttachCommandPaletteItemsOptions,
    GetGoToLineCommandPaletteItemsOptions,
    GetThemeCommandPaletteItemsOptions,
} from "./commandPalette.type";
import type { AppCommandPaletteItem } from "./commandPaletteDomain.type";

/** Builds a command palette item that navigates to a specific line in the active tab. */
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

/** Builds command palette items for choosing an executor port to attach to. */
export function getAttachCommandPaletteItems({
    workspaceExecutor,
    onOpenWorkspaceScreen,
}: GetAttachCommandPaletteItemsOptions): AppCommandPaletteItem[] {
    const { availablePortSummaries, hasSupportedExecutor, isAttached, isBusy } =
        workspaceExecutor.state;
    const { attachToPort } = workspaceExecutor.actions;

    if (isAttached) {
        return [
            {
                id: "command-attach-already-attached",
                label: "Executor already attached",
                description:
                    "Detach before choosing a different executor port.",
                icon: CommandIcon,
                keywords: "executor attach connected port",
                isDisabled: true,
                onSelect: () => {},
            },
        ];
    }

    if (!hasSupportedExecutor || availablePortSummaries.length === 0) {
        return [
            {
                id: "command-attach-unavailable",
                label: "No executor ports available",
                description: hasSupportedExecutor
                    ? "No executor ports are currently available."
                    : "No supported executor detected.",
                icon: CommandIcon,
                keywords: "executor attach unavailable port",
                isDisabled: true,
                onSelect: () => {},
            },
        ];
    }

    return availablePortSummaries.map((summary) => ({
        id: `command-attach-port-${summary.port}`,
        label: `Attach to port ${summary.port}`,
        description: "Connect to this executor port.",
        icon: CommandIcon,
        keywords: `executor attach connect port ${summary.port}`,
        isDisabled: isBusy,
        onSelect: () => {
            onOpenWorkspaceScreen();
            void attachToPort(summary.port);
        },
    }));
}

/** Builds command palette items for switching between light, dark, and system themes. */
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
