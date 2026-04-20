import type { Ace } from "ace-builds";

export type AceEditorInstance = Ace.Editor;

export type AceRendererInstance = Ace.VirtualRenderer & {
    $cursorLayer: {
        getPixelPosition: (
            position: Ace.Point,
            onScreen?: boolean,
        ) => {
            left: number;
            top: number;
        };
    };
    gutterWidth: number;
    lineHeight: number;
    layerConfig: {
        lineHeight: number;
        offset: number;
    };
    scrollLeft: number;
};

export type AceSessionWithMode = Ace.EditSession & {
    $mode?: {
        $id?: string;
    };
};

export type AceChangeDelta = {
    action?: "insert" | "remove";
    end?: {
        column: number;
        row: number;
    };
    lines?: string[];
    start?: {
        column: number;
        row: number;
    };
};
