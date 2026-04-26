import { CommandIcon, FolderOpenIcon } from "@hugeicons/core-free-icons";
import type { ReactElement } from "react";
import { useAppStore } from "../../../hooks/app/useAppStore";
import { getAppHotkeyShortcutLabel } from "../../../lib/app/hotkeys/hotkeys";
import { AppSearchField } from "../form/AppSearchField";
import { AppCommandPaletteScopeButton } from "./AppCommandPaletteScopeButton";
import type { AppCommandPaletteInputRowProps } from "./appCommandPalette.type";

/**
 * The input row for the command palette with search field and scope buttons.
 *
 * @param props - Component props
 * @param props.inputRef - Ref for the input element
 * @param props.mode - Current palette mode
 * @param props.query - Current search query
 * @param props.scope - Current scope
 * @param props.scopeLabels - Labels for each scope
 * @param props.scopePlaceholders - Placeholders for each scope
 * @returns A React component
 */
export function AppCommandPaletteInputRow({
    inputRef,
    mode,
    query,
    scope,
    scopeLabels,
    scopePlaceholders,
    onInputChange,
    onInputKeyDown,
    onScopeSelect,
}: AppCommandPaletteInputRowProps): ReactElement {
    const hotkeyBindings = useAppStore((state) => state.hotkeyBindings);

    return (
        <div className="flex items-center gap-2">
            <AppSearchField
                inputRef={inputRef}
                className="flex-1"
                value={query}
                onChange={onInputChange}
                onKeyDown={onInputKeyDown}
                placeholder={
                    mode === "attach"
                        ? "Select executor port..."
                        : mode === "goto-line"
                          ? "Go to line..."
                          : scopePlaceholders[scope]
                }
                ariaLabel={
                    mode === "attach"
                        ? "Select executor port"
                        : mode === "goto-line"
                          ? "Go to line"
                          : `${scopeLabels[scope]} search`
                }
                inputClassName="h-9 w-full rounded-full border border-fumi-200 bg-fumi-50 px-3 text-[13px] font-semibold text-fumi-900 shadow-[var(--shadow-app-floating)] outline-none transition-[border-color,box-shadow] duration-200 placeholder:font-medium placeholder:text-fumi-400 focus:border-fumi-300"
            />

            <div className="flex shrink-0 items-center gap-1.5">
                <AppCommandPaletteScopeButton
                    ariaLabel="Search commands"
                    content="Search commands"
                    shortcut={getAppHotkeyShortcutLabel(
                        "TOGGLE_COMMAND_PALETTE_COMMANDS",
                        hotkeyBindings,
                    )}
                    icon={CommandIcon}
                    isPressed={scope === "commands"}
                    onClick={() => onScopeSelect("commands")}
                />
                <AppCommandPaletteScopeButton
                    ariaLabel="Search workspaces"
                    content="Search workspaces"
                    shortcut={getAppHotkeyShortcutLabel(
                        "TOGGLE_COMMAND_PALETTE_WORKSPACES",
                        hotkeyBindings,
                    )}
                    icon={FolderOpenIcon}
                    isPressed={scope === "workspaces"}
                    onClick={() => onScopeSelect("workspaces")}
                />
            </div>
        </div>
    );
}
