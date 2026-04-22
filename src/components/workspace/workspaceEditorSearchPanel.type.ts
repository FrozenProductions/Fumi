import type { ChangeEvent, KeyboardEvent, RefObject } from "react";
import type { WorkspaceEditorSearchController } from "../../lib/workspace/editorSearch.type";

export type WorkspaceEditorSearchReplaceControlsProps = {
    isReplaceDropdownOpen: boolean;
    replaceDropdownRef: RefObject<HTMLDivElement | null>;
    searchPanel: WorkspaceEditorSearchController;
    onReplaceChange: (event: ChangeEvent<HTMLInputElement>) => void;
    onReplaceKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
    onReplaceAll: () => void;
    onToggleReplaceDropdown: () => void;
};

export type WorkspaceEditorSearchActionsProps = {
    searchPanel: WorkspaceEditorSearchController;
};
