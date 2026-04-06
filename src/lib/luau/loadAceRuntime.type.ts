import type { AppTheme } from "../../lib/app/app.type";

export type AceModeInstance = {
    $id?: string;
    getTokenizer: () => unknown;
};

export type AceModeModule = {
    Mode: new () => AceModeInstance;
};

export type AceRuntime = {
    config: {
        loadModule: (
            moduleName: string,
            onLoad: (module: unknown) => void,
        ) => void;
        setModuleUrl: (moduleName: string, url: string) => void;
    };
    define: (
        name: string,
        deps: string[],
        factory: (...args: any[]) => void,
    ) => void;
    require: (name: string) => unknown;
};

export type WindowWithAce = Window & {
    ace?: AceRuntime;
};

export type LoadedAceRuntime = {
    getMode: (fileName: string) => AceModeInstance;
    getTheme: (appTheme: AppTheme) => "github_dark" | "github_light_default";
};
