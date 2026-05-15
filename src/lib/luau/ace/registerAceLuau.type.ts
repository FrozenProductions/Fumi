type AceRequire = (name: string) => unknown;

type AceModuleExports = Record<string, unknown>;

export type AceEditorRuntime = {
    define: (
        name: string,
        deps: string[],
        factory: (
            require: AceRequire,
            exports: AceModuleExports,
            module: unknown,
        ) => void,
    ) => void;
    require: AceRequire;
};

export type AceOopModule = {
    inherits: (targetConstructor: unknown, superConstructor: unknown) => void;
};

export type AceTextHighlightRulesModule = {
    TextHighlightRules: unknown;
};

export type AceLuaModeModule = {
    Mode: {
        new (): unknown;
        call: (instance: unknown) => void;
    };
};

export type AceLuaFoldModeModule = {
    FoldMode: new () => unknown;
};

export type AceLuauHighlightRulesModule = {
    LuauHighlightRules: unknown;
};

export type LuauHighlightRulesInstance = {
    $rules: unknown;
    createKeywordMapper: (
        keywords: Record<string, string>,
        defaultToken: string,
    ) => unknown;
    normalizeRules: () => void;
};

export type LuauRuleContext = {
    next: unknown;
};

export type LuauModeInstance = {
    HighlightRules: unknown;
    foldingRules: unknown;
    $behaviour: unknown;
    $defaultBehaviour: unknown;
};

export type LuauModePrototype = {
    $id: string;
    lineCommentStart: string;
    blockComment: {
        start: string;
        end: string;
    };
    createWorker: () => null;
};
