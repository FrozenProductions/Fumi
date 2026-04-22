import type {
    ChangeEvent,
    KeyboardEvent as ReactKeyboardEvent,
    RefObject,
} from "react";
import type { WorkspaceScreenSession } from "../../lib/workspace/workspace.type";

export type UseWorkspaceTabRenameOptions = {
    workspace: WorkspaceScreenSession | null;
    renameWorkspaceTab: (
        tabId: string,
        nextBaseName: string,
    ) => Promise<boolean>;
    selectWorkspaceTab: (tabId: string) => void;
};

export type UseWorkspaceTabRenameResult = {
    hasRenameError: boolean;
    isRenameSubmitting: boolean;
    renameInputRef: RefObject<HTMLInputElement | null>;
    renameValue: string;
    renamingTabId: string | null;
    cancelTabRename: () => void;
    commitTabRename: () => Promise<void>;
    handleRenameInputBlur: () => void;
    handleRenameInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
    handleRenameInputKeyDown: (
        event: ReactKeyboardEvent<HTMLInputElement>,
    ) => void;
    handleStartRename: (tabId: string, fileName: string) => void;
};
