import { CommandIcon } from "@hugeicons/core-free-icons";
import {
    APP_EDITOR_TAB_SIZE_OPTIONS,
    APP_INTELLISENSE_PRIORITY_OPTIONS,
} from "../../../constants/app/settings";
import { isLuauFileName } from "../../luau/fileType";
import type { LuauFileSymbol } from "../../luau/luau.type";
import { scanLuauFileAnalysis } from "../../luau/symbolScanner/symbolScanner";
import { getLiveWorkspaceEditorContent } from "../../workspace/editor/liveWorkspaceEditorContent";
import { getWorkspaceLineNumberFromOffset } from "../../workspace/outline/outline";
import type {
    GetAttachCommandPaletteItemsOptions,
    GetGoToLineCommandPaletteItemsOptions,
    GetIntellisensePriorityCommandPaletteItemsOptions,
    GetSymbolCommandPaletteItemsOptions,
    GetTabSizeCommandPaletteItemsOptions,
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

function getSymbolLabel(symbol: LuauFileSymbol): string {
    return symbol.namespace
        ? `${symbol.namespace}.${symbol.label}`
        : symbol.label;
}

function isJumpableSymbol(symbol: LuauFileSymbol): boolean {
    return symbol.kind !== "comment" && symbol.kind !== "loadstring";
}

/** Builds command palette items for jumping to symbols in the active Luau tab. */
export function getSymbolCommandPaletteItems({
    activeTab,
    onGoToLine,
    onOpenWorkspaceScreen,
}: GetSymbolCommandPaletteItemsOptions): AppCommandPaletteItem[] {
    if (!activeTab || !isLuauFileName(activeTab.fileName)) {
        return [];
    }

    const content =
        getLiveWorkspaceEditorContent(activeTab.id) ?? activeTab.content;
    const analysis = scanLuauFileAnalysis(content);

    return analysis.symbols.filter(isJumpableSymbol).map((symbol) => {
        const label = getSymbolLabel(symbol);
        const lineNumber = getWorkspaceLineNumberFromOffset(
            content,
            symbol.declarationStart,
        );

        return {
            id: `command-goto-symbol-${symbol.kind}-${symbol.declarationStart}`,
            label,
            description: `Jump to line ${lineNumber} in ${activeTab.fileName}.`,
            icon: CommandIcon,
            meta: symbol.kind,
            keywords: `go to goto jump symbol outline ${symbol.kind} ${symbol.detail} ${activeTab.fileName}`,
            onSelect: () => {
                onOpenWorkspaceScreen();
                onGoToLine(lineNumber);
            },
        };
    });
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

/** Builds command palette items for switching the Intellisense completion priority. */
export function getIntellisensePriorityCommandPaletteItems({
    currentPriority,
    onSetPriority,
}: GetIntellisensePriorityCommandPaletteItemsOptions): AppCommandPaletteItem[] {
    return APP_INTELLISENSE_PRIORITY_OPTIONS.map(({ value, label }) => ({
        id: `command-intellisense-priority-${value}`,
        label,
        description: `Prefer ${label} completion ordering.`,
        icon: CommandIcon,
        meta: currentPriority === value ? "Current" : undefined,
        keywords: `intellisense autocomplete completion priority ${value} ${label}`,
        isDisabled: currentPriority === value,
        onSelect: () => {
            onSetPriority(value);
        },
    }));
}

/** Builds command palette items for switching the editor tab size. */
export function getTabSizeCommandPaletteItems({
    currentTabSize,
    onSetTabSize,
}: GetTabSizeCommandPaletteItemsOptions): AppCommandPaletteItem[] {
    return APP_EDITOR_TAB_SIZE_OPTIONS.map(({ value, label }) => ({
        id: `command-tab-size-${value}`,
        label,
        description: `Use ${label} for editor indentation.`,
        icon: CommandIcon,
        meta: currentTabSize === value ? "Current" : undefined,
        keywords: `editor setting tab size indentation spaces ${value}`,
        isDisabled: currentTabSize === value,
        onSelect: () => {
            onSetTabSize(value);
        },
    }));
}
