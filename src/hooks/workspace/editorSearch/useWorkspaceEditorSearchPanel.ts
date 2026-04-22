import type { RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { WORKSPACE_EDITOR_SEARCH_PANEL_EXIT_DURATION_MS } from "../../../constants/workspace/editor";
import type { WorkspaceEditorSearchController } from "../../../lib/workspace/editor/editorSearch.type";
import { usePresenceTransition } from "../../shared/usePresenceTransition";

type UseWorkspaceEditorSearchPanelResult = {
    refs: {
        queryInputRef: RefObject<HTMLInputElement | null>;
        replaceDropdownRef: RefObject<HTMLDivElement | null>;
    };
    state: {
        isClosing: boolean;
        isPresent: boolean;
        isReplaceDropdownOpen: boolean;
        isReplaceExpanded: boolean;
    };
    actions: {
        closeReplaceDropdown: () => void;
        handleReplaceAll: () => void;
        toggleReplaceDropdown: () => void;
        toggleReplaceMode: () => void;
    };
};

/**
 * Owns the local UI state and keyboard lifecycle for the editor search panel.
 */
export function useWorkspaceEditorSearchPanel(
    searchPanel: WorkspaceEditorSearchController,
): UseWorkspaceEditorSearchPanelResult {
    const [isReplaceExpanded, setIsReplaceExpanded] = useState(false);
    const [isReplaceDropdownOpen, setIsReplaceDropdownOpen] = useState(false);
    const queryInputRef = useRef<HTMLInputElement | null>(null);
    const replaceDropdownRef = useRef<HTMLDivElement>(null);
    const { focusRequestKey } = searchPanel;

    const { isPresent, isClosing } = usePresenceTransition({
        isOpen: searchPanel.state.isOpen,
        exitDurationMs: WORKSPACE_EDITOR_SEARCH_PANEL_EXIT_DURATION_MS,
    });

    useEffect(() => {
        if (!searchPanel.state.isOpen || !isPresent || focusRequestKey < 0) {
            return;
        }

        const focusQueryInput = (): void => {
            queryInputRef.current?.focus();
            queryInputRef.current?.select();
        };

        const animationFrameId = window.requestAnimationFrame(() => {
            focusQueryInput();
        });
        const timeoutId = window.setTimeout(() => {
            if (document.activeElement !== queryInputRef.current) {
                focusQueryInput();
            }
        }, 0);

        return () => {
            window.cancelAnimationFrame(animationFrameId);
            window.clearTimeout(timeoutId);
        };
    }, [focusRequestKey, isPresent, searchPanel.state.isOpen]);

    useEffect(() => {
        if (!isReplaceDropdownOpen) {
            return;
        }

        function handleClickOutside(event: MouseEvent): void {
            const target = event.target;

            if (
                target instanceof Node &&
                replaceDropdownRef.current &&
                !replaceDropdownRef.current.contains(target)
            ) {
                setIsReplaceDropdownOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isReplaceDropdownOpen]);

    useEffect(() => {
        if (!searchPanel.state.isOpen) {
            return;
        }

        const handleToggleShortcut = (
            event: globalThis.KeyboardEvent,
        ): void => {
            const isToggleShortcut =
                (event.metaKey || event.ctrlKey) &&
                event.key.toLowerCase() === "f";

            if (!isToggleShortcut) {
                return;
            }

            event.preventDefault();
            searchPanel.onToggle();
        };

        window.addEventListener("keydown", handleToggleShortcut);

        return () => {
            window.removeEventListener("keydown", handleToggleShortcut);
        };
    }, [searchPanel.onToggle, searchPanel.state.isOpen]);

    const toggleReplaceMode = (): void => {
        setIsReplaceExpanded((current) => !current);
    };

    const toggleReplaceDropdown = (): void => {
        setIsReplaceDropdownOpen((current) => !current);
    };

    const handleReplaceAll = (): void => {
        searchPanel.onReplaceAll();
        setIsReplaceDropdownOpen(false);
    };

    const closeReplaceDropdown = (): void => {
        setIsReplaceDropdownOpen(false);
    };

    return {
        refs: {
            queryInputRef,
            replaceDropdownRef,
        },
        state: {
            isClosing,
            isPresent,
            isReplaceDropdownOpen,
            isReplaceExpanded,
        },
        actions: {
            closeReplaceDropdown,
            handleReplaceAll,
            toggleReplaceDropdown,
            toggleReplaceMode,
        },
    };
}
