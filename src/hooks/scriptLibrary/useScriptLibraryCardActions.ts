import type { ScriptLibraryCardActions } from "../../components/scriptLibrary/scriptLibrary.type";
import { copyTextToClipboard } from "../../lib/platform/core/clipboard";
import {
    copyScriptToClipboard,
    fetchScriptText,
} from "../../lib/scriptLibrary/api";
import {
    getScriptLibraryPermalink,
    getWorkspaceScriptFileName,
} from "../../lib/scriptLibrary/scriptLibrary";
import type { ScriptLibraryEntry } from "../../lib/scriptLibrary/scriptLibrary.type";
import type { UseWorkspaceSessionResult } from "../../lib/workspace/session/session.type";
import type { UseScriptLibraryResult } from "./useScriptLibrary.type";

type UseScriptLibraryCardActionsOptions = {
    activity: UseScriptLibraryResult["activity"];
    actions: Pick<
        UseScriptLibraryResult["actions"],
        | "activateAddedScript"
        | "activateCopiedLink"
        | "activateCopiedScript"
        | "setAddingScriptFor"
        | "setCopyingScriptFor"
        | "toggleFavorite"
    >;
    favoriteIds: Set<string>;
    hasWorkspace: boolean;
    workspaceSession: UseWorkspaceSessionResult;
};

type UseScriptLibraryCardActionsResult = {
    createCardActions: (script: ScriptLibraryEntry) => ScriptLibraryCardActions;
};

/**
 * Creates action handlers for script library card interactions.
 *
 * Provides handlers for copying script/link to clipboard, adding to workspace,
 * and toggling favorite status. Tracks activity state (copying, adding) and
 * activation feedback for each action.
 *
 * @param options - Configuration for card actions
 * @param options.activity - Current activity state (copying, adding)
 * @param options.actions - Action dispatchers (activate, toggle favorite)
 * @param options.favoriteIds - Set of favorite script IDs
 * @param options.hasWorkspace - Whether a workspace is loaded
 * @param options.workspaceSession - Workspace session for adding scripts
 * @returns Factory function to create card actions for a script
 */
export function useScriptLibraryCardActions({
    activity,
    actions,
    favoriteIds,
    hasWorkspace,
    workspaceSession,
}: UseScriptLibraryCardActionsOptions): UseScriptLibraryCardActionsResult {
    const {
        addingScriptFor,
        addedScriptId,
        copiedLinkId,
        copiedScriptId,
        copyingScriptFor,
    } = activity;
    const {
        activateAddedScript,
        activateCopiedLink,
        activateCopiedScript,
        setAddingScriptFor,
        setCopyingScriptFor,
        toggleFavorite,
    } = actions;

    async function handleCopyLink(script: ScriptLibraryEntry): Promise<void> {
        await copyTextToClipboard(getScriptLibraryPermalink(script));
        activateCopiedLink(script._id);
    }

    async function handleCopyScript(script: ScriptLibraryEntry): Promise<void> {
        if (copyingScriptFor === script._id) {
            return;
        }

        setCopyingScriptFor(script._id);

        try {
            await copyScriptToClipboard(script);
            activateCopiedScript(script._id);
        } catch (error) {
            console.error("Failed to copy script.", error);
        } finally {
            setCopyingScriptFor(null);
        }
    }

    async function handleAddToWorkspace(
        script: ScriptLibraryEntry,
    ): Promise<void> {
        if (
            !workspaceSession.state.workspace ||
            addingScriptFor === script._id
        ) {
            return;
        }

        setAddingScriptFor(script._id);

        try {
            const scriptText = await fetchScriptText(script);
            const didAdd =
                await workspaceSession.workspaceActions.addWorkspaceScriptTab(
                    getWorkspaceScriptFileName(script),
                    scriptText,
                );

            if (didAdd) {
                activateAddedScript(script._id);
            }
        } catch (error) {
            console.error("Failed to add script to workspace.", error);
        } finally {
            setAddingScriptFor(null);
        }
    }

    function createCardActions(
        script: ScriptLibraryEntry,
    ): ScriptLibraryCardActions {
        return {
            hasWorkspace,
            isAddingToWorkspace: addingScriptFor === script._id,
            isAddedToWorkspace: addedScriptId === script._id,
            isCopyingScript: copyingScriptFor === script._id,
            isCopiedLink: copiedLinkId === script._id,
            isCopiedScript: copiedScriptId === script._id,
            isFavorite: favoriteIds.has(script._id),
            onAddToWorkspace: () => {
                void handleAddToWorkspace(script);
            },
            onCopyLink: () => {
                void handleCopyLink(script);
            },
            onCopyScript: () => {
                void handleCopyScript(script);
            },
            onToggleFavorite: () => {
                toggleFavorite(script);
            },
        };
    }

    return {
        createCardActions,
    };
}
