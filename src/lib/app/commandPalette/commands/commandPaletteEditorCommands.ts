import { CommandIcon } from "@hugeicons/core-free-icons";
import type { GetCommandPaletteCommandItemsOptions } from "../commandPalette.type";
import type { AppCommandPaletteItem } from "../commandPaletteDomain.type";

type CommandPaletteEditorOptions = Pick<
    GetCommandPaletteCommandItemsOptions,
    | "editorSettings"
    | "onActivateIntellisensePriorityMode"
    | "onActivateTabSizeMode"
    | "onSetEditorIntellisenseEnabled"
    | "onSetEditorRelativeLineNumbersEnabled"
    | "onSetEditorScopeHighlightingEnabled"
    | "onSetEditorSmoothCaretEnabled"
    | "onSetEditorWordWrapEnabled"
>;

function getToggleStateMeta(isEnabled: boolean): string {
    return isEnabled ? "On" : "Off";
}

function getNextToggleValue(isEnabled: boolean): boolean {
    return !isEnabled;
}

/** Builds command palette items for editor settings that are useful to toggle quickly. */
export function getEditorCommandItems({
    editorSettings,
    onActivateIntellisensePriorityMode,
    onActivateTabSizeMode,
    onSetEditorIntellisenseEnabled,
    onSetEditorRelativeLineNumbersEnabled,
    onSetEditorScopeHighlightingEnabled,
    onSetEditorSmoothCaretEnabled,
    onSetEditorWordWrapEnabled,
}: CommandPaletteEditorOptions): AppCommandPaletteItem[] {
    return [
        {
            id: "command-toggle-word-wrap",
            label: "Toggle Word Wrap",
            description: "Enable or disable editor text wrapping.",
            icon: CommandIcon,
            meta: getToggleStateMeta(editorSettings.isWordWrapEnabled),
            keywords: "editor setting wrap wrapping text lines toggle",
            onSelect: () => {
                onSetEditorWordWrapEnabled(
                    getNextToggleValue(editorSettings.isWordWrapEnabled),
                );
            },
        },
        {
            id: "command-toggle-relative-line-numbers",
            label: "Toggle Relative Line Numbers",
            description: "Switch the editor line number mode.",
            icon: CommandIcon,
            meta: getToggleStateMeta(
                editorSettings.isRelativeLineNumbersEnabled,
            ),
            keywords: "editor setting relative line numbers mode toggle",
            onSelect: () => {
                onSetEditorRelativeLineNumbersEnabled(
                    getNextToggleValue(
                        editorSettings.isRelativeLineNumbersEnabled,
                    ),
                );
            },
        },
        {
            id: "command-change-tab-size",
            label: "Change Tab Size",
            description: "Switch editor indentation width.",
            icon: CommandIcon,
            meta: `${editorSettings.tabSize} spaces`,
            keywords: "editor setting tab size indentation spaces 2 4 6 8",
            closeOnSelect: false,
            onSelect: onActivateTabSizeMode,
        },
        {
            id: "command-toggle-intellisense",
            label: "Toggle Intellisense",
            description: "Enable or disable editor code completion.",
            icon: CommandIcon,
            meta: getToggleStateMeta(editorSettings.isIntellisenseEnabled),
            keywords:
                "editor setting intellisense autocomplete completion suggestions toggle",
            onSelect: () => {
                onSetEditorIntellisenseEnabled(
                    getNextToggleValue(editorSettings.isIntellisenseEnabled),
                );
            },
        },
        {
            id: "command-change-intellisense-priority",
            label: "Change Intellisense Priority",
            description: "Switch completion ordering preference.",
            icon: CommandIcon,
            meta: editorSettings.intellisensePriority,
            keywords:
                "editor setting intellisense autocomplete completion priority luau language executor balanced",
            closeOnSelect: false,
            onSelect: onActivateIntellisensePriorityMode,
        },
        {
            id: "command-toggle-smooth-caret",
            label: "Toggle Smooth Caret",
            description: "Enable or disable editor caret animation.",
            icon: CommandIcon,
            meta: getToggleStateMeta(editorSettings.isSmoothCaretEnabled),
            keywords: "editor setting smooth caret cursor animation toggle",
            onSelect: () => {
                onSetEditorSmoothCaretEnabled(
                    getNextToggleValue(editorSettings.isSmoothCaretEnabled),
                );
            },
        },
        {
            id: "command-toggle-scope-highlighting",
            label: "Toggle Scope Highlighting",
            description: "Enable or disable matching scope highlighting.",
            icon: CommandIcon,
            meta: getToggleStateMeta(editorSettings.isScopeHighlightingEnabled),
            keywords: "editor setting scope highlighting match blocks toggle",
            onSelect: () => {
                onSetEditorScopeHighlightingEnabled(
                    getNextToggleValue(
                        editorSettings.isScopeHighlightingEnabled,
                    ),
                );
            },
        },
    ];
}
