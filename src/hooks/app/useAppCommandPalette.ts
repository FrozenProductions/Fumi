import {
    type ChangeEvent,
    type KeyboardEvent,
    type MouseEvent,
    type RefObject,
    startTransition,
    useCallback,
    useDeferredValue,
    useEffect,
    useRef,
    useState,
} from "react";
import {
    COMMAND_PALETTE_ENTER_FOCUS_DELAY_MS,
    COMMAND_PALETTE_EXIT_DURATION_MS,
} from "../../constants/app/commandPalette";
import type {
    AppCommandPaletteItem,
    AppCommandPaletteScope,
    AppCommandPaletteViewMode,
    AppCommandPaletteMode as RequestedAppCommandPaletteMode,
} from "../../lib/app/app.type";
import {
    getCommandCommandPaletteItems,
    getGoToLineCommandPaletteItems,
    getTabCommandPaletteItems,
    getWorkspaceCommandPaletteItems,
    matchesAppCommandPaletteItem,
    normalizeAppCommandPaletteSearchValue,
    parseGoToLineQuery,
} from "../../lib/app/commandPalette";
import { usePresenceTransition } from "../shared/usePresenceTransition";
import type { UseWorkspaceSessionResult } from "../workspace/useWorkspaceSession.type";

type UseAppCommandPaletteOptions = {
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

type UseAppCommandPaletteResult = {
    panelRef: RefObject<HTMLDivElement | null>;
    inputRef: RefObject<HTMLInputElement | null>;
    isPresent: boolean;
    isClosing: boolean;
    mode: AppCommandPaletteViewMode;
    query: string;
    scope: AppCommandPaletteScope;
    activeResultIndex: number;
    results: AppCommandPaletteItem[];
    commitSelection: (item: AppCommandPaletteItem) => void;
    handleBackdropMouseDown: (event: MouseEvent<HTMLDivElement>) => void;
    handleHoverItem: (index: number) => void;
    handleInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
    handleInputKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
    handleScopeSelect: (
        nextScope: Exclude<AppCommandPaletteScope, "tabs">,
    ) => void;
};

export function useAppCommandPalette({
    isOpen,
    requestedScope,
    requestedMode,
    workspaceSession,
    isSidebarOpen,
    onClose,
    onGoToLine,
    onToggleSidebar,
    onOpenSettings,
}: UseAppCommandPaletteOptions): UseAppCommandPaletteResult {
    const [query, setQuery] = useState("");
    const [scope, setScope] = useState<AppCommandPaletteScope>("tabs");
    const [mode, setMode] = useState<AppCommandPaletteViewMode>("default");
    const [activeResultIndex, setActiveResultIndex] = useState(0);
    const panelRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const focusTimeoutRef = useRef<number | null>(null);
    const previousOpenRequestRef = useRef<{
        isOpen: boolean;
        requestedMode: RequestedAppCommandPaletteMode | null;
        requestedScope: AppCommandPaletteScope | null;
    } | null>(null);
    const { isPresent, isClosing } = usePresenceTransition({
        isOpen,
        exitDurationMs: COMMAND_PALETTE_EXIT_DURATION_MS,
    });
    const deferredQuery = useDeferredValue(query);
    const normalizedQuery =
        normalizeAppCommandPaletteSearchValue(deferredQuery);
    const { activeTab } = workspaceSession;
    const currentLineNumber = activeTab ? activeTab.cursor.line + 1 : null;
    const goToLineNumber =
        mode === "goto-line" ? parseGoToLineQuery(query) : null;

    const scheduleInputFocus = useCallback(
        (options?: { delayMs?: number; shouldSelect?: boolean }): void => {
            if (focusTimeoutRef.current !== null) {
                window.clearTimeout(focusTimeoutRef.current);
                focusTimeoutRef.current = null;
            }

            const {
                delayMs = COMMAND_PALETTE_ENTER_FOCUS_DELAY_MS,
                shouldSelect = false,
            } = options ?? {};

            focusTimeoutRef.current = window.setTimeout(() => {
                inputRef.current?.focus();

                if (shouldSelect) {
                    inputRef.current?.select();
                }

                focusTimeoutRef.current = null;
            }, delayMs);
        },
        [],
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

    const tabItems = getTabCommandPaletteItems(workspaceSession);
    const commandItems = getCommandCommandPaletteItems({
        workspaceSession,
        isSidebarOpen,
        onActivateGoToLineMode: activateGoToLineMode,
        onOpenSettings,
        onToggleSidebar,
    });
    const workspaceItems = getWorkspaceCommandPaletteItems(workspaceSession);
    const goToLineItems = getGoToLineCommandPaletteItems({
        activeTab,
        goToLineNumber,
        onGoToLine,
    });

    const scopedItems =
        mode === "goto-line"
            ? goToLineItems
            : scope === "commands"
              ? commandItems
              : scope === "workspaces"
                ? workspaceItems
                : tabItems;
    const results =
        mode === "goto-line"
            ? goToLineItems
            : scopedItems
                  .filter((item) =>
                      matchesAppCommandPaletteItem(item, normalizedQuery),
                  )
                  .slice(0, 5);

    useEffect(() => {
        if (!isOpen && focusTimeoutRef.current !== null) {
            window.clearTimeout(focusTimeoutRef.current);
            focusTimeoutRef.current = null;
        }
    }, [isOpen]);

    useEffect(() => {
        return () => {
            if (focusTimeoutRef.current !== null) {
                window.clearTimeout(focusTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        setActiveResultIndex((currentIndex) => {
            if (results.length === 0) {
                return 0;
            }

            return Math.min(currentIndex, results.length - 1);
        });
    }, [results.length]);

    useEffect(() => {
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

    const handleInputChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>): void => {
            setQuery(event.target.value);
        },
        [],
    );

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

                if (mode === "goto-line") {
                    setMode("default");
                    setScope("commands");
                    setActiveResultIndex(0);
                    return;
                }

                onClose();
            }
        },
        [activeResultIndex, commitSelection, mode, onClose, query, results],
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

            window.requestAnimationFrame(() => {
                inputRef.current?.focus();
            });
        },
        [],
    );

    const handleHoverItem = useCallback((index: number): void => {
        setActiveResultIndex(index);
    }, []);

    return {
        panelRef,
        inputRef,
        isPresent,
        isClosing,
        mode,
        query,
        scope,
        activeResultIndex,
        results,
        commitSelection,
        handleBackdropMouseDown,
        handleHoverItem,
        handleInputChange,
        handleInputKeyDown,
        handleScopeSelect,
    };
}
