export type AceEditorRuntime = {
    define: (
        name: string,
        deps: string[],
        factory: (...args: any[]) => void,
    ) => void;
    require: (name: string) => any;
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
