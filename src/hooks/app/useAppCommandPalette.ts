import type { KeyboardEvent, MouseEvent } from "react";
import {
    startTransition,
    useCallback,
    useDeferredValue,
    useEffect,
    useLayoutEffect,
    useReducer,
    useRef,
} from "react";
import { getAppCommandPaletteResults } from "../../lib/app/commandPalette/commandPaletteController";
import type {
    AppCommandPaletteItem,
    AppCommandPaletteScope,
    AppCommandPaletteViewMode,
    AppCommandPaletteMode as RequestedAppCommandPaletteMode,
} from "../../lib/app/commandPalette/commandPaletteDomain.type";
import { parseGoToLineQuery } from "../../lib/app/commandPalette/commandPaletteShared";
import { normalizeAppCommandPaletteSearchValue } from "../../lib/app/commandPalette/search/commandPaletteSearch";
import type {
    AppCommandPaletteState,
    AppCommandPaletteStateUpdate,
    UseAppCommandPaletteOptions,
    UseAppCommandPaletteResult,
} from "./useAppCommandPalette.type";
import { useAppStore } from "./useAppStore";

const COMMAND_PALETTE_FOCUS_ATTEMPT_COUNT = 3;
const COMMAND_PALETTE_TABS_FOCUS_DELAY_MS = 20;

function updateAppCommandPaletteState(
    currentState: AppCommandPaletteState,
    update: AppCommandPaletteStateUpdate,
): AppCommandPaletteState {
    const nextState =
        typeof update === "function" ? update(currentState) : update;

    return {
        ...currentState,
        ...nextState,
    };
}

/**
 * Manages command palette state, input handling, scope switching, and result filtering.
 *
 * @remarks
 * Handles keyboard navigation, go-to-line mode, theme switching mode, and
 * coordinates with the workspace session and executor for contextual results.
 */
export function useAppCommandPalette({
    isOpen,
    requestedScope,
    requestedMode,
    visibility,
    workspaceSession,
    workspaceExecutor,
    isSidebarOpen,
    activeSidebarItem,
    theme,
    sidebarPosition,
    editorSettings,
    onClose,
    onGoToLine,
    onOpenWorkspaceScreen,
    onOpenAutomaticExecution,
    onOpenScriptLibrary,
    onOpenAccounts,
    onOpenExecutionHistory,
    onToggleSidebar,
    onToggleOutlinePanel,
    onOpenSettings,
    isOutlinePanelVisible,
    onSetTheme,
    onSetSidebarPosition,
    onZoomIn,
    onZoomOut,
    onZoomReset,
    onRequestRenameCurrentTab,
    onSetEditorIntellisenseEnabled,
    onSetEditorIntellisensePriority,
    onSetEditorRelativeLineNumbersEnabled,
    onSetEditorScopeHighlightingEnabled,
    onSetEditorSmoothCaretEnabled,
    onSetEditorTabSize,
    onSetEditorWordWrapEnabled,
}: UseAppCommandPaletteOptions): UseAppCommandPaletteResult {
    const [state, setState] = useReducer(updateAppCommandPaletteState, {
        query: "",
        scope: "tabs",
        mode: "default",
        activeResultIndex: 0,
    });
    const { query, scope, mode, activeResultIndex } = state;
    const panelRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const focusAnimationFrameRef = useRef<number | null>(null);
    const focusTimeoutRef = useRef<number | null>(null);
    const isOpenRef = useRef(isOpen);
    const previousOpenRequestRef = useRef<{
        isOpen: boolean;
        requestedMode: RequestedAppCommandPaletteMode | null;
        requestedScope: AppCommandPaletteScope | null;
    } | null>(null);
    const previousFocusStateRef = useRef<{
        isOpen: boolean;
        mode: AppCommandPaletteViewMode;
        scope: AppCommandPaletteScope;
    } | null>(null);
    const { isPresent, isClosing } = visibility;
    const deferredQuery = useDeferredValue(query);
    const normalizedQuery =
        normalizeAppCommandPaletteSearchValue(deferredQuery);
    const hotkeyBindings = useAppStore((state) => state.hotkeyBindings);
    const { activeTab } = workspaceSession.state;
    const currentLineNumber = activeTab ? activeTab.cursor.line + 1 : null;
    const goToLineNumber =
        mode === "goto-line" ? parseGoToLineQuery(query) : null;

    isOpenRef.current = isOpen;

    const cancelScheduledInputFocus = useCallback((): void => {
        if (focusAnimationFrameRef.current !== null) {
            window.cancelAnimationFrame(focusAnimationFrameRef.current);
            focusAnimationFrameRef.current = null;
        }

        if (focusTimeoutRef.current !== null) {
            window.clearTimeout(focusTimeoutRef.current);
            focusTimeoutRef.current = null;
        }
    }, []);

    const focusInput = useCallback(
        (options?: { shouldSelect?: boolean }): void => {
            const input = inputRef.current;

            if (!input || !isOpenRef.current) {
                return;
            }

            input.focus({ preventScroll: true });

            if (options?.shouldSelect === true) {
                input.select();
            }
        },
        [],
    );

    const scheduleInputFocus = useCallback(
        (options?: { delayMs?: number; shouldSelect?: boolean }): void => {
            cancelScheduledInputFocus();

            const { delayMs = 0, shouldSelect = false } = options ?? {};
            const requestFocus = (attemptsRemaining: number): void => {
                focusAnimationFrameRef.current = null;
                focusInput({
                    shouldSelect:
                        shouldSelect &&
                        attemptsRemaining ===
                            COMMAND_PALETTE_FOCUS_ATTEMPT_COUNT,
                });

                if (attemptsRemaining <= 1 || !isOpenRef.current) {
                    return;
                }

                focusAnimationFrameRef.current = window.requestAnimationFrame(
                    () => requestFocus(attemptsRemaining - 1),
                );
            };

            if (delayMs > 0) {
                focusTimeoutRef.current = window.setTimeout(() => {
                    focusTimeoutRef.current = null;
                    focusAnimationFrameRef.current =
                        window.requestAnimationFrame(() =>
                            requestFocus(COMMAND_PALETTE_FOCUS_ATTEMPT_COUNT),
                        );
                }, delayMs);

                return;
            }

            focusAnimationFrameRef.current = window.requestAnimationFrame(() =>
                requestFocus(COMMAND_PALETTE_FOCUS_ATTEMPT_COUNT),
            );
        },
        [cancelScheduledInputFocus, focusInput],
    );

    const activateGoToLineMode = useCallback((): void => {
        startTransition(() => {
            setState({
                mode: "goto-line",
                scope: "commands",
                query: String(currentLineNumber ?? ""),
                activeResultIndex: 0,
            });
        });

        scheduleInputFocus({ shouldSelect: true });
    }, [currentLineNumber, scheduleInputFocus]);

    const activateThemeMode = useCallback((): void => {
        startTransition(() => {
            setState({
                mode: "theme",
                scope: "commands",
                query: "",
                activeResultIndex: 0,
            });
        });

        scheduleInputFocus({ shouldSelect: true });
    }, [scheduleInputFocus]);

    const activateAttachMode = useCallback((): void => {
        startTransition(() => {
            setState({
                mode: "attach",
                scope: "commands",
                query: "",
                activeResultIndex: 0,
            });
        });

        scheduleInputFocus({ shouldSelect: true });
    }, [scheduleInputFocus]);

    const activateArchivedTabMode = useCallback((): void => {
        startTransition(() => {
            setState({
                mode: "archived-tab",
                scope: "commands",
                query: "",
                activeResultIndex: 0,
            });
        });

        scheduleInputFocus({ shouldSelect: true });
    }, [scheduleInputFocus]);

    const activateDeleteArchivedTabMode = useCallback((): void => {
        startTransition(() => {
            setState({
                mode: "delete-archived-tab",
                scope: "commands",
                query: "",
                activeResultIndex: 0,
            });
        });

        scheduleInputFocus({ shouldSelect: true });
    }, [scheduleInputFocus]);

    const activateIntellisensePriorityMode = useCallback((): void => {
        startTransition(() => {
            setState({
                mode: "intellisense-priority",
                scope: "commands",
                query: "",
                activeResultIndex: 0,
            });
        });

        scheduleInputFocus({ shouldSelect: true });
    }, [scheduleInputFocus]);

    const activateSymbolMode = useCallback((): void => {
        startTransition(() => {
            setState({
                mode: "symbol",
                scope: "commands",
                query: "",
                activeResultIndex: 0,
            });
        });

        scheduleInputFocus({ shouldSelect: true });
    }, [scheduleInputFocus]);

    const activateTabSizeMode = useCallback((): void => {
        startTransition(() => {
            setState({
                mode: "tab-size",
                scope: "commands",
                query: "",
                activeResultIndex: 0,
            });
        });

        scheduleInputFocus({ shouldSelect: true });
    }, [scheduleInputFocus]);

    const results = getAppCommandPaletteResults({
        workspaceSession,
        workspaceExecutor,
        isSidebarOpen,
        activeSidebarItem,
        theme,
        sidebarPosition,
        editorSettings,
        onGoToLine,
        onOpenWorkspaceScreen,
        onOpenAutomaticExecution,
        onOpenScriptLibrary,
        onOpenAccounts,
        onOpenExecutionHistory,
        onToggleSidebar,
        onToggleOutlinePanel,
        onOpenSettings,
        isOutlinePanelVisible,
        onSetTheme,
        onSetSidebarPosition,
        onZoomIn,
        onZoomOut,
        onZoomReset,
        onRequestRenameCurrentTab,
        onSetEditorIntellisenseEnabled,
        onSetEditorIntellisensePriority,
        onSetEditorRelativeLineNumbersEnabled,
        onSetEditorScopeHighlightingEnabled,
        onSetEditorSmoothCaretEnabled,
        onSetEditorTabSize,
        onSetEditorWordWrapEnabled,
        hotkeyBindings,
        activeTab,
        goToLineNumber,
        mode,
        scope,
        normalizedQuery,
        onActivateArchivedTabMode: activateArchivedTabMode,
        onActivateAttachMode: activateAttachMode,
        onActivateDeleteArchivedTabMode: activateDeleteArchivedTabMode,
        onActivateGoToLineMode: activateGoToLineMode,
        onActivateIntellisensePriorityMode: activateIntellisensePriorityMode,
        onActivateSymbolMode: activateSymbolMode,
        onActivateTabSizeMode: activateTabSizeMode,
        onActivateThemeMode: activateThemeMode,
    });

    useEffect(() => {
        if (!isOpen) {
            cancelScheduledInputFocus();
        }
    }, [cancelScheduledInputFocus, isOpen]);

    useEffect(() => {
        return () => {
            cancelScheduledInputFocus();
        };
    }, [cancelScheduledInputFocus]);

    useEffect(() => {
        function handleCaptureEscape(event: globalThis.KeyboardEvent): void {
            if (
                event.key === "Escape" &&
                (mode === "archived-tab" ||
                    mode === "attach" ||
                    mode === "delete-archived-tab" ||
                    mode === "goto-line" ||
                    mode === "intellisense-priority" ||
                    mode === "symbol" ||
                    mode === "tab-size" ||
                    mode === "theme")
            ) {
                event.preventDefault();
                event.stopImmediatePropagation();
                setState({
                    mode: "default",
                    scope: "commands",
                    activeResultIndex: 0,
                    query: "",
                });
                scheduleInputFocus();
            }
        }

        window.addEventListener("keydown", handleCaptureEscape, true);
        return () => {
            window.removeEventListener("keydown", handleCaptureEscape, true);
        };
    }, [mode, scheduleInputFocus]);

    const clampedActiveResultIndex =
        results.length === 0
            ? 0
            : Math.min(activeResultIndex, results.length - 1);

    useLayoutEffect(() => {
        const previousOpenRequest = previousOpenRequestRef.current;
        const didOpen = isOpen && !previousOpenRequest?.isOpen;
        const didRequestedModeChange =
            isOpen && previousOpenRequest?.requestedMode !== requestedMode;
        const didRequestedScopeChange =
            isOpen && previousOpenRequest?.requestedScope !== requestedScope;

        previousOpenRequestRef.current = {
            isOpen,
            requestedMode,
            requestedScope,
        };

        if (!isOpen) {
            return;
        }

        if (!didOpen && !didRequestedModeChange && !didRequestedScopeChange) {
            return;
        }

        if (requestedMode === "goto-line" && activeTab) {
            activateGoToLineMode();
            return;
        }

        setState({
            mode: "default",
            scope: requestedScope ?? "tabs",
            activeResultIndex: 0,
            query: "",
        });

        scheduleInputFocus({ shouldSelect: true });
    }, [
        activateGoToLineMode,
        activeTab,
        isOpen,
        requestedMode,
        requestedScope,
        scheduleInputFocus,
    ]);

    useLayoutEffect(() => {
        const previousFocusState = previousFocusStateRef.current;
        const didOpen = isOpen && !previousFocusState?.isOpen;
        const didModeChange = isOpen && previousFocusState?.mode !== mode;
        const didScopeChange = isOpen && previousFocusState?.scope !== scope;

        previousFocusStateRef.current = {
            isOpen,
            mode,
            scope,
        };

        if (!didOpen && !didModeChange && !didScopeChange) {
            return;
        }

        scheduleInputFocus({ shouldSelect: didOpen });
    }, [isOpen, mode, scheduleInputFocus, scope]);

    useEffect(() => {
        if (!isOpen || mode !== "default" || scope !== "tabs") {
            return;
        }

        scheduleInputFocus({ delayMs: COMMAND_PALETTE_TABS_FOCUS_DELAY_MS });
    }, [isOpen, mode, scheduleInputFocus, scope]);

    const commitSelection = useCallback(
        (item: AppCommandPaletteItem): void => {
            if (item.isDisabled) {
                return;
            }

            item.onSelect();

            if (item.closeOnSelect !== false) {
                onClose();
            }
        },
        [onClose],
    );

    const handleBackdropMouseDown = useCallback(
        (event: MouseEvent<HTMLDivElement>): void => {
            if (panelRef.current?.contains(event.target as Node) ?? false) {
                return;
            }

            onClose();
        },
        [onClose],
    );

    const handleInputChange = useCallback((nextQuery: string): void => {
        setState({ query: nextQuery });
    }, []);

    const handleInputKeyDown = useCallback(
        (event: KeyboardEvent<HTMLInputElement>): void => {
            if (event.key === "ArrowDown") {
                event.preventDefault();
                setState((currentState) => ({
                    activeResultIndex:
                        results.length === 0
                            ? 0
                            : Math.min(
                                  currentState.activeResultIndex + 1,
                                  results.length - 1,
                              ),
                }));
                return;
            }

            if (event.key === "ArrowUp") {
                event.preventDefault();
                setState((currentState) => ({
                    activeResultIndex:
                        results.length === 0
                            ? 0
                            : Math.max(currentState.activeResultIndex - 1, 0),
                }));
                return;
            }

            if (event.key === "Enter") {
                if (mode === "goto-line") {
                    event.preventDefault();

                    if (goToLineNumber !== null) {
                        onGoToLine(goToLineNumber);
                        onClose();
                    }

                    return;
                }

                const nextItem = results[clampedActiveResultIndex];

                if (!nextItem || nextItem.isDisabled) {
                    return;
                }

                event.preventDefault();
                commitSelection(nextItem);
                return;
            }

            if (event.key === "Escape") {
                event.preventDefault();

                if (
                    mode === "archived-tab" ||
                    mode === "attach" ||
                    mode === "delete-archived-tab" ||
                    mode === "goto-line" ||
                    mode === "intellisense-priority" ||
                    mode === "symbol" ||
                    mode === "tab-size" ||
                    mode === "theme"
                ) {
                    setState({
                        mode: "default",
                        scope: "commands",
                        activeResultIndex: 0,
                        query: "",
                    });
                    return;
                }

                onClose();
            }
        },
        [
            clampedActiveResultIndex,
            commitSelection,
            goToLineNumber,
            mode,
            onClose,
            onGoToLine,
            results,
        ],
    );

    const handleScopeSelect = useCallback(
        (nextScope: Exclude<AppCommandPaletteScope, "tabs">): void => {
            startTransition(() => {
                setState((currentState) => ({
                    mode: "default",
                    scope:
                        currentState.scope === nextScope ? "tabs" : nextScope,
                    activeResultIndex: 0,
                }));
            });

            scheduleInputFocus();
        },
        [scheduleInputFocus],
    );

    const handleHoverItem = useCallback((index: number): void => {
        setState({ activeResultIndex: index });
    }, []);

    return {
        visibility: {
            isPresent,
            isClosing,
        },
        input: {
            panelRef,
            inputRef,
            mode,
            query,
            scope,
        },
        results: {
            activeResultIndex: clampedActiveResultIndex,
            results,
        },
        handlers: {
            commitSelection,
            handleBackdropMouseDown,
            handleHoverItem,
            handleInputChange,
            handleInputKeyDown,
            handleScopeSelect,
        },
    };
}
