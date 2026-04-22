import { ACTORS_GLOBAL_FUNCTION_NAMES } from "../../constants/luau/actors/actorsCompletions";
import { LUAU_MODE_IDENTIFIER } from "../../constants/luau/core/luau";
import {
    LUAU_BUILTIN_CONSTANTS,
    LUAU_BUILTIN_TYPES,
    LUAU_CONTROL_KEYWORDS,
    LUAU_DECLARATION_KEYWORDS,
    LUAU_GLOBAL_FUNCTION_NAMES,
    LUAU_LIBRARY_NAMES,
    LUAU_ROBLOX_NAMESPACE_NAMES,
} from "../../constants/luau/core/syntax";
import {
    RAKNET_NAMESPACE_FUNCTION_NAMES,
    RAKNET_NAMESPACE_NAMES,
} from "../../constants/luau/raknet/raknetCompletions";
import {
    SUNC_GLOBAL_FUNCTION_NAMES,
    SUNC_NAMESPACE_FUNCTION_NAMES,
    SUNC_NAMESPACE_NAMES,
} from "../../constants/luau/sunc/suncCompletions";
import {
    UNC_GLOBAL_FUNCTION_NAMES,
    UNC_NAMESPACE_NAMES,
} from "../../constants/luau/unc/uncCompletions";
import type {
    AceEditorRuntime,
    LuauModePrototype,
} from "./registerAceLuau.type";

function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toKeywordPattern(values: readonly string[]): string {
    return Array.from(new Set(values))
        .sort((left, right) => right.length - left.length)
        .map(escapeRegex)
        .join("|");
}

function hasAceModule(ace: AceEditorRuntime, moduleName: string): boolean {
    try {
        return Boolean(ace.require(moduleName));
    } catch {
        return false;
    }
}

function defineLuauMode(ace: AceEditorRuntime): void {
    if (hasAceModule(ace, "ace/mode/luau")) {
        return;
    }

    const keywordPattern = toKeywordPattern([
        ...LUAU_CONTROL_KEYWORDS,
        ...LUAU_DECLARATION_KEYWORDS,
    ]);
    const builtinConstantPattern = toKeywordPattern(LUAU_BUILTIN_CONSTANTS);
    const builtinTypePattern = toKeywordPattern(LUAU_BUILTIN_TYPES);
    const globalFunctionPattern = toKeywordPattern([
        ...LUAU_GLOBAL_FUNCTION_NAMES,
        ...SUNC_GLOBAL_FUNCTION_NAMES,
        ...SUNC_NAMESPACE_FUNCTION_NAMES,
        ...UNC_GLOBAL_FUNCTION_NAMES,
        ...ACTORS_GLOBAL_FUNCTION_NAMES,
        ...RAKNET_NAMESPACE_FUNCTION_NAMES,
        "game",
        "plugin",
        "script",
        "shared",
        "workspace",
    ]);
    const libraryPattern = toKeywordPattern([
        ...LUAU_LIBRARY_NAMES,
        ...LUAU_ROBLOX_NAMESPACE_NAMES,
        ...SUNC_NAMESPACE_NAMES,
        ...UNC_NAMESPACE_NAMES,
        ...RAKNET_NAMESPACE_NAMES,
    ]);

    ace.define(
        "ace/mode/luau_highlight_rules",
        [
            "require",
            "exports",
            "module",
            "ace/lib/oop",
            "ace/mode/text_highlight_rules",
        ],
        (require, exports) => {
            const oop = require("ace/lib/oop");
            const TextHighlightRules =
                require("ace/mode/text_highlight_rules").TextHighlightRules;

            const LuauHighlightRules = function (this: any) {
                const keywordMapper = this.createKeywordMapper(
                    {
                        keyword: keywordPattern,
                        "support.function": globalFunctionPattern,
                        "support.type": builtinTypePattern,
                        "constant.language": builtinConstantPattern,
                        "constant.library": libraryPattern,
                        "variable.language": "self",
                    },
                    "identifier",
                );

                const decimalInteger = "(?:0|[1-9](?:_?\\d)*)";
                const binaryInteger = "(?:0[bB][01](?:_?[01])*)";
                const hexInteger = "(?:0[xX][\\dA-Fa-f](?:_?[\\dA-Fa-f])*)";
                const exponent = "(?:[eE][+\\-]?\\d(?:_?\\d)*)";
                const decimalFloat =
                    "(?:(?:\\d(?:_?\\d)*)?\\.\\d(?:_?\\d)*(?:" +
                    exponent +
                    ")?|\\d(?:_?\\d)*" +
                    exponent +
                    ")";
                const numberPattern =
                    "(?:" +
                    decimalFloat +
                    "|" +
                    binaryInteger +
                    "|" +
                    hexInteger +
                    "|" +
                    decimalInteger +
                    ")";

                this.$rules = {
                    start: [
                        {
                            stateName: "bracketedComment",
                            onMatch: function (
                                value: string,
                                state: string,
                                stack: unknown[],
                            ) {
                                stack.unshift(
                                    this.next,
                                    value.length - 2,
                                    state,
                                );
                                return "comment";
                            },
                            regex: /--\[=*\[/,
                            next: [
                                {
                                    onMatch: function (
                                        value: string,
                                        _state: string,
                                        stack: any[],
                                    ) {
                                        if (value.length === stack[1]) {
                                            stack.shift();
                                            stack.shift();
                                            this.next = stack.shift();
                                        } else {
                                            this.next = "";
                                        }

                                        return "comment";
                                    },
                                    regex: /\]=*\]/,
                                    next: "start",
                                },
                                {
                                    defaultToken: "comment.body",
                                },
                            ],
                        },
                        {
                            token: "comment",
                            regex: "\\-\\-.*$",
                        },
                        {
                            stateName: "bracketedString",
                            onMatch: function (
                                value: string,
                                state: string,
                                stack: unknown[],
                            ) {
                                stack.unshift(this.next, value.length, state);
                                return "string.start";
                            },
                            regex: /\[=*\[/,
                            next: [
                                {
                                    onMatch: function (
                                        value: string,
                                        _state: string,
                                        stack: any[],
                                    ) {
                                        if (value.length === stack[1]) {
                                            stack.shift();
                                            stack.shift();
                                            this.next = stack.shift();
                                        } else {
                                            this.next = "";
                                        }

                                        return "string.end";
                                    },
                                    regex: /\]=*\]/,
                                    next: "start",
                                },
                                {
                                    defaultToken: "string",
                                },
                            ],
                        },
                        {
                            token: "string",
                            regex: "`(?:[^`\\\\]|\\\\.)*`",
                        },
                        {
                            token: "string",
                            regex: '"(?:[^\\\\]|\\\\.)*?"',
                        },
                        {
                            token: "string",
                            regex: "'(?:[^\\\\]|\\\\.)*?'",
                        },
                        {
                            token: "constant.numeric",
                            regex: numberPattern,
                        },
                        {
                            token: keywordMapper,
                            regex: "[a-zA-Z_][a-zA-Z0-9_]*\\b",
                        },
                        {
                            token: "keyword.operator",
                            regex: "->|::|\\+|\\-|\\*|\\/|%|\\#|\\^|~|&|\\||\\?|<|>|<=|>=|==|~=|=|\\:|\\.\\.\\.|\\.\\.",
                        },
                        {
                            token: "paren.lparen",
                            regex: "[\\[\\(\\{]",
                        },
                        {
                            token: "paren.rparen",
                            regex: "[\\]\\)\\}]",
                        },
                        {
                            token: "text",
                            regex: "\\s+|\\w+",
                        },
                    ],
                };

                this.normalizeRules();
            };

            oop.inherits(LuauHighlightRules, TextHighlightRules);
            exports.LuauHighlightRules = LuauHighlightRules;
        },
    );

    ace.define(
        LUAU_MODE_IDENTIFIER,
        [
            "require",
            "exports",
            "module",
            "ace/lib/oop",
            "ace/mode/lua",
            "ace/mode/folding/lua",
            "ace/mode/luau_highlight_rules",
        ],
        (require, exports) => {
            const oop = require("ace/lib/oop");
            const LuaMode = require("ace/mode/lua").Mode;
            const FoldMode = require("ace/mode/folding/lua").FoldMode;
            const LuauHighlightRules =
                require("ace/mode/luau_highlight_rules").LuauHighlightRules;

            const LuauMode = function (this: any) {
                LuaMode.call(this);
                this.HighlightRules = LuauHighlightRules;
                this.foldingRules = new FoldMode();
                this.$behaviour = this.$defaultBehaviour;
            };

            oop.inherits(LuauMode, LuaMode);

            const luauModePrototype = LuauMode.prototype as LuauModePrototype;
            luauModePrototype.$id = LUAU_MODE_IDENTIFIER;
            luauModePrototype.lineCommentStart = "--";
            luauModePrototype.blockComment = { start: "--[[", end: "--]]" };
            luauModePrototype.createWorker = () => null;

            exports.Mode = LuauMode;
        },
    );
}

let didConfigureLuauAce = false;

export function configureLuauAce(rawAce: unknown): void {
    if (didConfigureLuauAce) {
        return;
    }

    const ace = rawAce as AceEditorRuntime;

    defineLuauMode(ace);

    didConfigureLuauAce = true;
}
