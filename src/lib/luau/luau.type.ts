export type LuauSymbolKind =
    | "comment"
    | "constant"
    | "datatype"
    | "enum"
    | "function"
    | "keyword"
    | "library"
    | "namespace"
    | "service";

export type LuauDocEntry = {
    summary: string;
    source: string;
    signature?: string;
};

export type LuauCompletionSourceGroup = "file" | "language" | "executor";

export type LuauCompletionItem = {
    label: string;
    kind: LuauSymbolKind;
    detail: string;
    doc: LuauDocEntry;
    insertText?: string;
    namespace?: string;
    score?: number;
    sourceGroup: LuauCompletionSourceGroup;
};

export type LuauNamespaceCompletionGroup = {
    namespace: string;
    items: LuauCompletionItem[];
};

export type LuauFileSymbol = {
    label: string;
    kind: LuauSymbolKind;
    detail: string;
    declarationStart: number;
    declarationEnd: number;
    isLexical: boolean;
    ownerFunctionEnd: number | null;
    ownerFunctionStart: number | null;
    scopeStart: number;
    scopeEnd: number;
    visibleStart: number;
    visibleEnd: number;
    doc: LuauDocEntry;
    insertText?: string;
    score?: number;
};

export type LuauCompletionPopupPosition = {
    verticalPlacement: "above" | "below";
    left: number;
    top: number;
    width: number;
    maxHeight: number;
};

export type LuauCompletionPopupState = {
    explicit: boolean;
    items: LuauCompletionItem[];
    position: LuauCompletionPopupPosition;
    replaceStartColumn: number;
    replaceEndColumn: number;
    row: number;
    selectedIndex: number;
};
