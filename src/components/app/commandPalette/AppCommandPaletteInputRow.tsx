import { CommandIcon, FolderOpenIcon } from "@hugeicons/core-free-icons";
import type { ReactElement } from "react";
import { APP_TEXT_INPUT_PROPS } from "../../../constants/app/input";
import { useAppStore } from "../../../hooks/app/useAppStore";
import { getAppHotkeyShortcutLabel } from "../../../lib/app/hotkeys";
import { AppCommandPaletteScopeButton } from "../AppCommandPaletteScopeButton";
import type { AppCommandPaletteInputRowProps } from "./appCommandPalette.type";

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
            <div className="relative min-w-0 flex-1">
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={onInputChange}
                    onKeyDown={onInputKeyDown}
                    placeholder={
                        mode === "goto-line"
                            ? "Go to line..."
                            : scopePlaceholders[scope]
                    }
                    aria-label={
                        mode === "goto-line"
                            ? "Go to line"
                            : `${scopeLabels[scope]} search`
                    }
                    {...APP_TEXT_INPUT_PROPS}
                    className="h-9 w-full rounded-full border border-fumi-200 bg-fumi-50 px-3 text-[13px] font-semibold text-fumi-900 shadow-[var(--shadow-app-floating)] outline-none transition-[border-color,box-shadow] duration-200 placeholder:font-medium placeholder:text-fumi-400 focus:border-fumi-300"
                />
            </div>

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
