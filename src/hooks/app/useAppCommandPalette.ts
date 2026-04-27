import type { KeyboardEvent, MouseEvent } from "react";
import {
    startTransition,
    useCallback,
    useDeferredValue,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
import { parseGoToLineQuery } from "../../lib/app/commandPalette/commandPalette";
import { getAppCommandPaletteResults } from "../../lib/app/commandPalette/commandPaletteController";
import type {
    AppCommandPaletteItem,
    AppCommandPaletteScope,
    AppCommandPaletteViewMode,
    AppCommandPaletteMode as RequestedAppCommandPaletteMode,
} from "../../lib/app/commandPalette/commandPaletteDomain.type";
import { normalizeAppCommandPaletteSearchValue } from "../../lib/app/commandPalette/search/commandPaletteSearch";
import type {
    UseAppCommandPaletteOptions,
    UseAppCommandPaletteResult,
} from "./useAppCommandPalette.type";
import { useAppStore } from "./useAppStore";

const COMMAND_PALETTE_FOCUS_ATTEMPT_COUNT = 3;

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
}: UseAppCommandPaletteOptions): UseAppCommandPaletteResult {
    const [query, setQuery] = useState("");
    const [scope, setScope] = useState<AppCommandPaletteScope>("tabs");
    const [mode, setMode] = useState<AppCommandPaletteViewMode>("default");
    const [activeResultIndex, setActiveResultIndex] = useState(0);
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
            setMode("goto-line");
            setScope("commands");
            setQuery(String(currentLineNumber ?? ""));
            setActiveResultIndex(0);
        });

        scheduleInputFocus({ shouldSelect: true });
    }, [currentLineNumber, scheduleInputFocus]);

    const activateThemeMode = useCallback((): void => {
        startTransition(() => {
            setMode("theme");
            setScope("commands");
            setQuery("");
            setActiveResultIndex(0);
        });

        scheduleInputFocus({ shouldSelect: true });
    }, [scheduleInputFocus]);

    const activateAttachMode = useCallback((): void => {
        startTransition(() => {
            setMode("attach");
            setScope("commands");
            setQuery("");
            setActiveResultIndex(0);
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
        hotkeyBindings,
        activeTab,
        goToLineNumber,
        mode,
        scope,
        normalizedQuery,
        onActivateAttachMode: activateAttachMode,
        onActivateGoToLineMode: activateGoToLineMode,
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
        setActiveResultIndex((currentIndex) => {
            if (results.length === 0) {
                return 0;
            }

            return Math.min(currentIndex, results.length - 1);
        });
    }, [results.length]);

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

        setMode("default");
        setScope(requestedScope ?? "tabs");
        setActiveResultIndex(0);
        setQuery("");

        scheduleInputFocus({ shouldSelect: true });
    }, [
        activateGoToLineMode,
        activeTab,
        isOpen,
        requestedMode,
        requestedScope,
        scheduleInputFocus,
    ]);

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
        setQuery(nextQuery);
    }, []);

    const handleInputKeyDown = useCallback(
        (event: KeyboardEvent<HTMLInputElement>): void => {
            if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveResultIndex((currentIndex) =>
                    results.length === 0
                        ? 0
                        : Math.min(currentIndex + 1, results.length - 1),
                );
                return;
            }

            if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveResultIndex((currentIndex) =>
                    results.length === 0 ? 0 : Math.max(currentIndex - 1, 0),
                );
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

                const nextItem = results[activeResultIndex];

                if (!nextItem || nextItem.isDisabled) {
                    return;
                }

                event.preventDefault();
                commitSelection(nextItem);
                return;
            }

            if (event.key === "Escape") {
                event.preventDefault();

                if (query) {
                    setQuery("");
                    return;
                }

                if (
                    mode === "attach" ||
                    mode === "goto-line" ||
                    mode === "theme"
                ) {
                    setMode("default");
                    setScope("commands");
                    setActiveResultIndex(0);
                    return;
                }

                onClose();
            }
        },
        [
            activeResultIndex,
            commitSelection,
            goToLineNumber,
            mode,
            onClose,
            onGoToLine,
            query,
            results,
        ],
    );

    const handleScopeSelect = useCallback(
        (nextScope: Exclude<AppCommandPaletteScope, "tabs">): void => {
            startTransition(() => {
                setMode("default");
                setScope((currentScope) =>
                    currentScope === nextScope ? "tabs" : nextScope,
                );
                setActiveResultIndex(0);
            });

            scheduleInputFocus();
        },
        [scheduleInputFocus],
    );

    const handleHoverItem = useCallback((index: number): void => {
        setActiveResultIndex(index);
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
            activeResultIndex,
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
