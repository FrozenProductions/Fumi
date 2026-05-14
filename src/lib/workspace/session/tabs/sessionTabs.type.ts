import type { WorkspaceCursorState } from "../sessionCursor.type";

export type WorkspaceTabState = {
    id: string;
    fileName: string;
    cursor: WorkspaceCursorState;
    isPinned?: boolean;
    archivedAt?: number;
};

export type WorkspaceTabSnapshot = WorkspaceTabState & {
    content: string;
    isDirty: boolean;
};

export type WorkspaceTab = WorkspaceTabSnapshot & {
    savedContent: string;
    contentRevision?: number;
};

export type WorkspaceScreenTab = Pick<WorkspaceTabState, "fileName" | "id"> & {
    isPinned: boolean;
    isDirty: boolean;
};
