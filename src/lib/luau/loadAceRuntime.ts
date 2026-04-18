import aceScriptUrl from "ace-builds/src-noconflict/ace.js?url";
import modeLuaScriptUrl from "ace-builds/src-noconflict/mode-lua.js?url";
import modeTextScriptUrl from "ace-builds/src-noconflict/mode-text.js?url";
import themeGithubDarkScriptUrl from "ace-builds/src-noconflict/theme-github_dark.js?url";
import themeGithubLightDefaultScriptUrl from "ace-builds/src-noconflict/theme-github_light_default.js?url";
import type { AppTheme } from "../../lib/app/app.type";
import { getEditorModeForFileName } from "./fileType";
import type {
    AceModeInstance,
    AceModeModule,
    AceRuntime,
    LoadedAceRuntime,
    WindowWithAce,
} from "./loadAceRuntime.type";
import { configureLuauAce } from "./registerAceLuau";

let aceRuntimePromise: Promise<LoadedAceRuntime> | null = null;

function loadScript(src: string): Promise<void> {
    const existingScript = document.querySelector<HTMLScriptElement>(
        `script[data-fumi-ace-src="${src}"]`,
    );

    if (existingScript?.dataset.loaded === "true") {
        return Promise.resolve();
    }

    if (existingScript) {
        return new Promise((resolve, reject) => {
            existingScript.addEventListener("load", () => resolve(), {
                once: true,
            });
            existingScript.addEventListener(
                "error",
                () => reject(new Error(`Failed to load Ace asset: ${src}`)),
                { once: true },
            );
        });
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement("script");

        script.src = src;
        script.async = false;
        script.dataset.fumiAceSrc = src;
        script.addEventListener(
            "load",
            () => {
                script.dataset.loaded = "true";
                resolve();
            },
            { once: true },
        );
        script.addEventListener(
            "error",
            () => reject(new Error(`Failed to load Ace asset: ${src}`)),
            { once: true },
        );

        document.head.appendChild(script);
    });
}

function getAceRuntimeFromWindow(): AceRuntime {
    const ace = (window as WindowWithAce).ace;

    if (!ace) {
        throw new Error("Ace runtime did not attach to window");
    }

    return ace;
}

function configureAceModuleUrls(ace: AceRuntime): void {
    ace.config.setModuleUrl("ace/mode/text", modeTextScriptUrl);
    ace.config.setModuleUrl("ace/mode/lua", modeLuaScriptUrl);
    ace.config.setModuleUrl("ace/theme/github_dark", themeGithubDarkScriptUrl);
    ace.config.setModuleUrl(
        "ace/theme/github_light_default",
        themeGithubLightDefaultScriptUrl,
    );
}

function loadAceModule(ace: AceRuntime, moduleName: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
        ace.config.loadModule(moduleName, (module) => {
            if (!module) {
                reject(new Error(`Failed to load Ace module: ${moduleName}`));
                return;
            }

            resolve(module);
        });
    });
}

function getRequiredModeModule(
    ace: AceRuntime,
    moduleName: string,
): AceModeModule {
    const module = ace.require(moduleName) as AceModeModule | undefined;

    if (!module?.Mode) {
        throw new Error(`Ace mode module is unavailable: ${moduleName}`);
    }

    return module;
}

export function loadAceRuntime(): Promise<LoadedAceRuntime> {
    if (typeof window === "undefined") {
        return Promise.reject(new Error("Ace runtime requires a browser"));
    }

    if (aceRuntimePromise) {
        return aceRuntimePromise;
    }

    aceRuntimePromise = (async () => {
        await loadScript(aceScriptUrl);

        const ace = getAceRuntimeFromWindow();

        configureAceModuleUrls(ace);

        await Promise.all([
            loadAceModule(ace, "ace/mode/text"),
            loadAceModule(ace, "ace/mode/lua"),
            loadAceModule(ace, "ace/theme/github_dark"),
            loadAceModule(ace, "ace/theme/github_light_default"),
        ]);

        configureLuauAce(ace);

        const TextMode = getRequiredModeModule(ace, "ace/mode/text").Mode;
        const LuauMode = getRequiredModeModule(ace, "ace/mode/luau").Mode;

        const textMode = new TextMode();
        const luauMode = new LuauMode();

        return {
            getMode(fileName: string): AceModeInstance {
                return getEditorModeForFileName(fileName) === "luau"
                    ? luauMode
                    : textMode;
            },
            getTextMode(): AceModeInstance {
                return textMode;
            },
            getTheme(
                appTheme: AppTheme,
            ): "github_dark" | "github_light_default" {
                const resolved =
                    appTheme === "system"
                        ? window.matchMedia("(prefers-color-scheme: dark)")
                              .matches
                            ? "dark"
                            : "light"
                        : appTheme;

                return resolved === "dark"
                    ? "github_dark"
                    : "github_light_default";
            },
        };
    })();

    return aceRuntimePromise;
}
