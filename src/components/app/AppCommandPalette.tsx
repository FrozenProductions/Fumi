import type { ReactElement } from "react";
import {
    APP_COMMAND_PALETTE_SCOPE_LABELS,
    APP_COMMAND_PALETTE_SCOPE_PLACEHOLDERS,
} from "../../constants/app/commandPalette";
import { useAppCommandPalette } from "../../hooks/app/useAppCommandPalette";
import type { AppCommandPaletteProps } from "./appShell.type";
import { AppCommandPaletteInputRow } from "./commandPalette/AppCommandPaletteInputRow";
import { AppCommandPaletteResults } from "./commandPalette/AppCommandPaletteResults";

export function AppCommandPalette({
    isOpen,
    requestedScope,
    requestedMode,
    workspaceSession,
    workspaceExecutor,
    isSidebarOpen,
    activeSidebarItem,
    theme,
    onClose,
    onGoToLine,
    onOpenWorkspaceScreen,
    onOpenScriptLibrary,
    onOpenAccounts,
    onToggleSidebar,
    onToggleOutlinePanel,
    onOpenSettings,
    isOutlinePanelVisible,
    onSetTheme,
    onZoomIn,
    onZoomOut,
    onZoomReset,
    onRequestRenameCurrentTab,
}: AppCommandPaletteProps): ReactElement | null {
    const { handlers, input, results, visibility } = useAppCommandPalette({
        isOpen,
        requestedScope,
        requestedMode,
        workspaceSession,
        workspaceExecutor,
        isSidebarOpen,
        activeSidebarItem,
        theme,
        onClose,
        onGoToLine,
        onOpenWorkspaceScreen,
        onOpenScriptLibrary,
        onOpenAccounts,
        onToggleSidebar,
        onToggleOutlinePanel,
        onOpenSettings,
        isOutlinePanelVisible,
        onSetTheme,
        onZoomIn,
        onZoomOut,
        onZoomReset,
        onRequestRenameCurrentTab,
    });
    const { isClosing, isPresent } = visibility;
    const { inputRef, mode, panelRef, query, scope } = input;
    const { activeResultIndex, results: resultItems } = results;
    const {
        commitSelection,
        handleBackdropMouseDown,
        handleHoverItem,
        handleInputChange,
        handleInputKeyDown,
        handleScopeSelect,
    } = handlers;

    if (!isPresent) {
        return null;
    }

    const backdropMotionClassName = isClosing
        ? "motion-safe:motion-opacity-out-0 motion-safe:motion-duration-140 motion-safe:motion-ease-out-cubic"
        : "motion-safe:motion-opacity-in-0 motion-safe:motion-duration-100 motion-safe:motion-ease-out-cubic";
    const shellMotionClassName = isClosing
        ? "motion-safe:motion-opacity-out-0 motion-safe:-motion-translate-y-out-[12%] motion-safe:motion-scale-out-[94%] motion-safe:motion-duration-200 motion-safe:motion-ease-in-quart"
        : "motion-safe:motion-opacity-in-0 motion-safe:-motion-translate-y-in-[12%] motion-safe:motion-scale-in-[97%] motion-safe:motion-duration-170 motion-safe:motion-ease-spring-smooth";

    return (
        <div
            className={[
                "absolute inset-0 z-[60] flex items-start justify-center px-4 pb-6 pt-24",
                isClosing ? "pointer-events-none" : "",
                backdropMotionClassName,
            ].join(" ")}
            onMouseDown={handleBackdropMouseDown}
        >
            <div
                ref={panelRef}
                className={[
                    "w-full max-w-[28rem] origin-top motion-reduce:animate-none motion-reduce:transform-none",
                    shellMotionClassName,
                ].join(" ")}
                onMouseDown={(event) => {
                    event.stopPropagation();
                }}
            >
                <div className="flex flex-col items-stretch gap-2">
                    <AppCommandPaletteInputRow
                        inputRef={inputRef}
                        mode={mode}
                        query={query}
                        scope={scope}
                        scopeLabels={APP_COMMAND_PALETTE_SCOPE_LABELS}
                        scopePlaceholders={
                            APP_COMMAND_PALETTE_SCOPE_PLACEHOLDERS
                        }
                        onInputChange={handleInputChange}
                        onInputKeyDown={handleInputKeyDown}
                        onScopeSelect={handleScopeSelect}
                    />
                    <AppCommandPaletteResults
                        activeResultIndex={activeResultIndex}
                        isClosing={isClosing}
                        results={resultItems}
                        onCommitSelection={commitSelection}
                        onHoverItem={handleHoverItem}
                    />
                </div>
            </div>
        </div>
    );
}
