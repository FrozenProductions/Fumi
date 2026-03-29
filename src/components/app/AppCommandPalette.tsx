import type { ReactElement } from "react";
import { useAppCommandPalette } from "../../hooks/app/useAppCommandPalette";
import {
    APP_COMMAND_PALETTE_SCOPE_LABELS,
    APP_COMMAND_PALETTE_SCOPE_PLACEHOLDERS,
} from "../../lib/app/commandPalette";
import type {
    AppCommandPaletteScope,
    AppCommandPaletteMode as RequestedAppCommandPaletteMode,
} from "../../types/app/commandPalette";
import type { UseWorkspaceSessionResult } from "../../types/workspace/session";
import { AppCommandPaletteInputRow } from "./commandPalette/AppCommandPaletteInputRow";
import { AppCommandPaletteResults } from "./commandPalette/AppCommandPaletteResults";

type AppCommandPaletteProps = {
    isOpen: boolean;
    requestedScope: AppCommandPaletteScope | null;
    requestedMode: RequestedAppCommandPaletteMode | null;
    workspaceSession: UseWorkspaceSessionResult;
    isSidebarOpen: boolean;
    onClose: () => void;
    onGoToLine: (lineNumber: number) => void;
    onToggleSidebar: () => void;
    onOpenSettings: () => void;
};

export function AppCommandPalette({
    isOpen,
    requestedScope,
    requestedMode,
    workspaceSession,
    isSidebarOpen,
    onClose,
    onGoToLine,
    onToggleSidebar,
    onOpenSettings,
}: AppCommandPaletteProps): ReactElement | null {
    const {
        activeResultIndex,
        commitSelection,
        handleBackdropMouseDown,
        handleHoverItem,
        handleInputChange,
        handleInputKeyDown,
        handleScopeSelect,
        inputRef,
        isClosing,
        isPresent,
        mode,
        panelRef,
        query,
        results,
        scope,
    } = useAppCommandPalette({
        isOpen,
        requestedScope,
        requestedMode,
        workspaceSession,
        isSidebarOpen,
        onClose,
        onGoToLine,
        onToggleSidebar,
        onOpenSettings,
    });

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
                        results={results}
                        onCommitSelection={commitSelection}
                        onHoverItem={handleHoverItem}
                    />
                </div>
            </div>
        </div>
    );
}
