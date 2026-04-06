import type { ChangeEvent, KeyboardEvent as ReactKeyboardEvent } from "react";
import { useCallback, useEffect, useRef } from "react";
import { splitWorkspaceFileName } from "../../lib/workspace/fileName";
import type {
    UseWorkspaceTabRenameOptions,
    UseWorkspaceTabRenameResult,
} from "./useWorkspaceTabRename.type";
import { useWorkspaceUiStore } from "./useWorkspaceUiStore";

export function useWorkspaceTabRename({
    workspace,
    renameWorkspaceTab,
    selectWorkspaceTab,
}: UseWorkspaceTabRenameOptions): UseWorkspaceTabRenameResult {
    const renameInputRef = useRef<HTMLInputElement | null>(null);
    const isRenameSubmittingRef = useRef(false);
    const skipRenameCommitOnBlurRef = useRef(false);
    const renamingTabId = useWorkspaceUiStore((state) => state.renamingTabId);
    const renameValue = useWorkspaceUiStore((state) => state.renameValue);
    const isRenameSubmitting = useWorkspaceUiStore(
        (state) => state.isRenameSubmitting,
    );
    const hasRenameError = useWorkspaceUiStore((state) => state.hasRenameError);
    const startTabRename = useWorkspaceUiStore((state) => state.startTabRename);
    const setRenameValue = useWorkspaceUiStore((state) => state.setRenameValue);
    const setRenameSubmitting = useWorkspaceUiStore(
        (state) => state.setRenameSubmitting,
    );
    const setRenameError = useWorkspaceUiStore((state) => state.setRenameError);
    const resetRenameState = useWorkspaceUiStore(
        (state) => state.resetRenameState,
    );
    const resetWorkspaceUiState = useWorkspaceUiStore(
        (state) => state.resetWorkspaceUiState,
    );

    const commitTabRename = useCallback(async (): Promise<void> => {
        if (!renamingTabId || isRenameSubmittingRef.current) {
            return;
        }

        if (!renameValue.trim()) {
            setRenameError(true);
            window.requestAnimationFrame(() => {
                const input = renameInputRef.current;

                if (!input) {
                    return;
                }

                input.focus();
                input.select();
            });
            return;
        }

        isRenameSubmittingRef.current = true;
        setRenameSubmitting(true);

        const didRename = await renameWorkspaceTab(renamingTabId, renameValue);

        isRenameSubmittingRef.current = false;
        setRenameSubmitting(false);

        if (didRename) {
            resetRenameState();
            return;
        }

        setRenameError(true);
        window.requestAnimationFrame(() => {
            const input = renameInputRef.current;

            if (!input) {
                return;
            }

            input.focus();
            input.select();
        });
    }, [
        renameValue,
        renameWorkspaceTab,
        renamingTabId,
        resetRenameState,
        setRenameError,
        setRenameSubmitting,
    ]);

    const cancelTabRename = useCallback((): void => {
        skipRenameCommitOnBlurRef.current = true;
        isRenameSubmittingRef.current = false;
        setRenameSubmitting(false);
        resetRenameState();
    }, [resetRenameState, setRenameSubmitting]);

    const handleStartRename = useCallback(
        (tabId: string, fileName: string): void => {
            if (isRenameSubmittingRef.current || renamingTabId) {
                return;
            }

            const { baseName } = splitWorkspaceFileName(fileName);

            selectWorkspaceTab(tabId);
            startTabRename(tabId, baseName);
        },
        [renamingTabId, selectWorkspaceTab, startTabRename],
    );

    const handleRenameInputBlur = useCallback((): void => {
        if (skipRenameCommitOnBlurRef.current) {
            skipRenameCommitOnBlurRef.current = false;
            return;
        }

        void commitTabRename();
    }, [commitTabRename]);

    const handleRenameInputChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>): void => {
            setRenameValue(event.target.value);
            setRenameError(false);
        },
        [setRenameError, setRenameValue],
    );

    const handleRenameInputKeyDown = useCallback(
        (event: ReactKeyboardEvent<HTMLInputElement>): void => {
            if (event.key === "Enter") {
                event.preventDefault();
                void commitTabRename();
                return;
            }

            if (event.key !== "Escape") {
                return;
            }

            event.preventDefault();
            cancelTabRename();
        },
        [cancelTabRename, commitTabRename],
    );

    useEffect(() => {
        if (!renamingTabId) {
            return;
        }

        const input = renameInputRef.current;

        if (!input) {
            return;
        }

        input.focus();
        input.select();
    }, [renamingTabId]);

    useEffect(() => {
        if (!renamingTabId) {
            return;
        }

        const hasRenamingTab = workspace?.tabs.some(
            (tab) => tab.id === renamingTabId,
        );

        if (hasRenamingTab) {
            return;
        }

        skipRenameCommitOnBlurRef.current = false;
        isRenameSubmittingRef.current = false;
        setRenameSubmitting(false);
        resetRenameState();
    }, [renamingTabId, resetRenameState, setRenameSubmitting, workspace]);

    useEffect(() => {
        if (!hasRenameError) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setRenameError(false);
        }, 1000);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [hasRenameError, setRenameError]);

    useEffect(() => {
        return () => {
            skipRenameCommitOnBlurRef.current = false;
            isRenameSubmittingRef.current = false;
            resetWorkspaceUiState();
        };
    }, [resetWorkspaceUiState]);

    return {
        hasRenameError,
        isRenameSubmitting,
        renameInputRef,
        renameValue,
        renamingTabId,
        cancelTabRename,
        commitTabRename,
        handleRenameInputBlur,
        handleRenameInputChange,
        handleRenameInputKeyDown,
        handleStartRename,
    };
}
