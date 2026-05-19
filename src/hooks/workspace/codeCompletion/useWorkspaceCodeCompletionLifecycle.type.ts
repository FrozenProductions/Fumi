import type { AceEditorInstance } from "../../../lib/workspace/codeCompletion/ace.type";

/** Serializable Ace editor session state for persistence across tab switches. */
export type StoredAceSessionState = {
    content: string;
    scrollLeft: number;
    scrollTop: number;
    selection: unknown;
    undoHistory: object;
};

/** Minimal event target for listening to Ace cursor changes. */
export type AceSelectionEventTarget = {
    on: (eventName: "changeCursor", listener: () => void) => void;
    off: (eventName: "changeCursor", listener: () => void) => void;
};

/** An Ace editor instance augmented with a `destroy` event for lifecycle tracking. */
export type AceEditorDestroyEventTarget = AceEditorInstance & {
    destroyed?: boolean;
    on: (eventName: "destroy", listener: () => void) => void;
    off: (eventName: "destroy", listener: () => void) => void;
};
