import type {
    LuauKeywordDocs,
    LuauTypeDocs,
} from "../../lib/luau/completion.type";
import type { LuauFileAnalysis } from "../../lib/luau/symbolScanner.type";

export const EMPTY_LUAU_FILE_ANALYSIS: LuauFileAnalysis = {
    functionScopes: [],
    symbols: [],
};
export const LUAU_MODE_IDENTIFIER = "ace/mode/luau";
export const MAX_LUAU_COMPLETION_ITEMS = 6;
export const CURRENT_FILE_DOC_SOURCE = "Current File";
export const COMPLETION_POPUP_VIEWPORT_PADDING = 16;
export const COMPLETION_POPUP_MIN_WIDTH = 188;
export const COMPLETION_POPUP_SMALL_WIDTH = 188;
export const COMPLETION_POPUP_NORMAL_WIDTH = 220;
export const COMPLETION_POPUP_LARGE_MIN_WIDTH = 260;
export const COMPLETION_POPUP_LABEL_FONT =
    '600 10px "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif';
export const COMPLETION_POPUP_DETAIL_FONT =
    '600 7.5px "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif';
export const LUAU_KEYWORD_DOCS: LuauKeywordDocs = {
    as: "Assert that an expression should be treated as a specific type.",
    continue:
        "Skip the rest of the current loop iteration and continue with the next one.",
    function: "Define a function body.",
    local: "Declare a local variable or function.",
    typeof: "Capture the inferred type of an expression for use in type annotations.",
};
export const LUAU_TYPE_DOCS: LuauTypeDocs = {
    any: "Opt out of static type checking for a value.",
    boolean: "Boolean true/false type.",
    buffer: "Binary buffer type for byte-oriented storage.",
    function: "Callable function type.",
    never: "Represents an impossible code path or uninhabited type.",
    nil: "Represents the absence of a value.",
    number: "Numeric value type.",
    string: "String value type.",
    table: "Table value type.",
    thread: "Coroutine thread type.",
    unknown: "A value of unknown type that must be refined before use.",
    userdata: "Opaque userdata type.",
    vector: "Native vector type available in Luau runtimes that support it.",
};
