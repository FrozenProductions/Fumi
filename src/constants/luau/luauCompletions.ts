import {
    createLuauLanguageCompletionItem as createItem,
    createLuauNamespaceCompletionGroup as createNamespaceGroup,
} from "../../lib/luau/completionBuilder";
import type {
    LuauCompletionItem,
    LuauNamespaceCompletionGroup,
} from "../../lib/luau/luau.type";

const LUAU_DOC_SOURCE = "Official Luau syntax/type/standard library docs";
const ROBLOX_DOC_SOURCE = "Official Roblox Creator and Engine API docs";
export const LUAU_TOP_LEVEL_COMPLETIONS: LuauCompletionItem[] = [
    createItem(
        "_G",
        "constant",
        "global",
        "Global environment table.",
        LUAU_DOC_SOURCE,
    ),
    createItem(
        "_VERSION",
        "constant",
        "global",
        "Language version string exposed by the runtime.",
        LUAU_DOC_SOURCE,
    ),
    createItem(
        "assert",
        "function",
        "global function",
        "Raise an error if a condition is falsy.",
        LUAU_DOC_SOURCE,
        { signature: "assert(value: any, message?: string) -> any" },
    ),
    createItem(
        "error",
        "function",
        "global function",
        "Raise a runtime error with the provided message or value.",
        LUAU_DOC_SOURCE,
        { signature: "error(message: any, level?: number) -> never" },
    ),
    createItem(
        "getmetatable",
        "function",
        "global function",
        "Return the metatable for a value if it exists.",
        LUAU_DOC_SOURCE,
        { signature: "getmetatable(value: any) -> table?" },
    ),
    createItem(
        "ipairs",
        "function",
        "global function",
        "Iterate over an array-like table in numeric order.",
        LUAU_DOC_SOURCE,
        { signature: "ipairs(list: table) -> iterator" },
    ),
    createItem(
        "next",
        "function",
        "global function",
        "Advance table iteration manually.",
        LUAU_DOC_SOURCE,
        { signature: "next(table: table, index?: any) -> (any, any)" },
    ),
    createItem(
        "pairs",
        "function",
        "global function",
        "Iterate over key/value pairs in a table.",
        LUAU_DOC_SOURCE,
        { signature: "pairs(map: table) -> iterator" },
    ),
    createItem(
        "pcall",
        "function",
        "global function",
        "Call a function in protected mode and capture runtime errors.",
        LUAU_DOC_SOURCE,
        {
            signature:
                "pcall(fn: (...any) -> ...any, ...any) -> (boolean, ...any)",
        },
    ),
    createItem(
        "print",
        "function",
        "global function",
        "Write values to the output stream.",
        LUAU_DOC_SOURCE,
        { signature: "print(...any) -> ()" },
    ),
    createItem(
        "raweq",
        "function",
        "global function",
        "Compare two values without invoking metamethods.",
        LUAU_DOC_SOURCE,
        { signature: "raweq(a: any, b: any) -> boolean" },
    ),
    createItem(
        "rawget",
        "function",
        "global function",
        "Read a table field without invoking metamethods.",
        LUAU_DOC_SOURCE,
        { signature: "rawget(table: table, key: any) -> any" },
    ),
    createItem(
        "rawlen",
        "function",
        "global function",
        "Return the raw length of a table or string.",
        LUAU_DOC_SOURCE,
        { signature: "rawlen(value: table | string) -> number" },
    ),
    createItem(
        "rawset",
        "function",
        "global function",
        "Write a table field without invoking metamethods.",
        LUAU_DOC_SOURCE,
        { signature: "rawset(table: table, key: any, value: any) -> table" },
    ),
    createItem(
        "select",
        "function",
        "global function",
        "Access variadic function arguments.",
        LUAU_DOC_SOURCE,
        { signature: 'select(index: number | "#", ...any) -> any' },
    ),
    createItem(
        "setmetatable",
        "function",
        "global function",
        "Attach a metatable to a table value.",
        LUAU_DOC_SOURCE,
        { signature: "setmetatable(table: table, metatable: table?) -> table" },
    ),
    createItem(
        "tonumber",
        "function",
        "global function",
        "Convert a value to a number if possible.",
        LUAU_DOC_SOURCE,
        { signature: "tonumber(value: any, base?: number) -> number?" },
    ),
    createItem(
        "tostring",
        "function",
        "global function",
        "Convert a value to a string representation.",
        LUAU_DOC_SOURCE,
        { signature: "tostring(value: any) -> string" },
    ),
    createItem(
        "type",
        "function",
        "global function",
        "Return the basic Lua type name for a value.",
        LUAU_DOC_SOURCE,
        { signature: "type(value: any) -> string" },
    ),
    createItem(
        "typeof",
        "function",
        "global function",
        "Return the Luau or platform-specific type name for a value.",
        LUAU_DOC_SOURCE,
        { signature: "typeof(value: any) -> string" },
    ),
    createItem(
        "unpack",
        "function",
        "global function",
        "Expand sequential table values into multiple results.",
        LUAU_DOC_SOURCE,
        { signature: "unpack(list: table, i?: number, j?: number) -> ...any" },
    ),
    createItem(
        "warn",
        "function",
        "global function",
        "Write a warning message to output.",
        LUAU_DOC_SOURCE,
        { signature: "warn(...any) -> ()" },
    ),
    createItem(
        "xpcall",
        "function",
        "global function",
        "Call a function in protected mode with a custom error handler.",
        LUAU_DOC_SOURCE,
        {
            signature:
                "xpcall(fn: (...any) -> ...any, err: (any) -> any, ...any) -> (boolean, ...any)",
        },
    ),
    createItem(
        "bit32",
        "library",
        "library",
        "Bitwise helpers exposed as a standard Luau library.",
        LUAU_DOC_SOURCE,
    ),
    createItem(
        "buffer",
        "library",
        "library",
        "Binary buffer library for fixed-size byte storage and access.",
        LUAU_DOC_SOURCE,
    ),
    createItem(
        "coroutine",
        "library",
        "library",
        "Coroutine creation, scheduling, and inspection helpers.",
        LUAU_DOC_SOURCE,
    ),
    createItem(
        "math",
        "library",
        "library",
        "Math constants and numeric utility functions.",
        LUAU_DOC_SOURCE,
    ),
    createItem(
        "os",
        "library",
        "library",
        "Time and locale-related standard library functions.",
        LUAU_DOC_SOURCE,
    ),
    createItem(
        "string",
        "library",
        "library",
        "String formatting, matching, and manipulation helpers.",
        LUAU_DOC_SOURCE,
    ),
    createItem(
        "table",
        "library",
        "library",
        "Table construction and manipulation helpers.",
        LUAU_DOC_SOURCE,
    ),
    createItem(
        "utf8",
        "library",
        "library",
        "UTF-8 aware string utilities.",
        LUAU_DOC_SOURCE,
    ),
];

export const LUAU_NAMESPACE_COMPLETIONS: LuauNamespaceCompletionGroup[] = [
    createNamespaceGroup("math", [
        createItem(
            "abs",
            "function",
            "math function",
            "Return absolute value.",
            LUAU_DOC_SOURCE,
            { namespace: "math", signature: "math.abs(x: number) -> number" },
        ),
        createItem(
            "acos",
            "function",
            "math function",
            "Return arc cosine.",
            LUAU_DOC_SOURCE,
            { namespace: "math", signature: "math.acos(x: number) -> number" },
        ),
        createItem(
            "asin",
            "function",
            "math function",
            "Return arc sine.",
            LUAU_DOC_SOURCE,
            { namespace: "math", signature: "math.asin(x: number) -> number" },
        ),
        createItem(
            "atan",
            "function",
            "math function",
            "Return arc tangent.",
            LUAU_DOC_SOURCE,
            {
                namespace: "math",
                signature: "math.atan(y: number, x?: number) -> number",
            },
        ),
        createItem(
            "atan2",
            "function",
            "math function",
            "Return the arc tangent from y/x.",
            LUAU_DOC_SOURCE,
            {
                namespace: "math",
                signature: "math.atan2(y: number, x: number) -> number",
            },
        ),
        createItem(
            "ceil",
            "function",
            "math function",
            "Round toward positive infinity.",
            LUAU_DOC_SOURCE,
            { namespace: "math", signature: "math.ceil(x: number) -> number" },
        ),
        createItem(
            "clamp",
            "function",
            "math function",
            "Clamp a number into a range.",
            ROBLOX_DOC_SOURCE,
            {
                namespace: "math",
                signature:
                    "math.clamp(x: number, min: number, max: number) -> number",
            },
        ),
        createItem(
            "cos",
            "function",
            "math function",
            "Return cosine.",
            LUAU_DOC_SOURCE,
            { namespace: "math", signature: "math.cos(x: number) -> number" },
        ),
        createItem(
            "deg",
            "function",
            "math function",
            "Convert radians to degrees.",
            LUAU_DOC_SOURCE,
            { namespace: "math", signature: "math.deg(x: number) -> number" },
        ),
        createItem(
            "exp",
            "function",
            "math function",
            "Raise e to a power.",
            LUAU_DOC_SOURCE,
            { namespace: "math", signature: "math.exp(x: number) -> number" },
        ),
        createItem(
            "floor",
            "function",
            "math function",
            "Round toward negative infinity.",
            LUAU_DOC_SOURCE,
            { namespace: "math", signature: "math.floor(x: number) -> number" },
        ),
        createItem(
            "fmod",
            "function",
            "math function",
            "Return the remainder of a division.",
            LUAU_DOC_SOURCE,
            {
                namespace: "math",
                signature: "math.fmod(x: number, y: number) -> number",
            },
        ),
        createItem(
            "huge",
            "constant",
            "math constant",
            "Positive infinity constant.",
            LUAU_DOC_SOURCE,
            { namespace: "math" },
        ),
        createItem(
            "log",
            "function",
            "math function",
            "Return logarithm in an optional base.",
            LUAU_DOC_SOURCE,
            {
                namespace: "math",
                signature: "math.log(x: number, base?: number) -> number",
            },
        ),
        createItem(
            "max",
            "function",
            "math function",
            "Return the largest argument.",
            LUAU_DOC_SOURCE,
            { namespace: "math", signature: "math.max(...number) -> number" },
        ),
        createItem(
            "min",
            "function",
            "math function",
            "Return the smallest argument.",
            LUAU_DOC_SOURCE,
            { namespace: "math", signature: "math.min(...number) -> number" },
        ),
        createItem(
            "noise",
            "function",
            "math function",
            "Return coherent noise for procedural generation.",
            ROBLOX_DOC_SOURCE,
            {
                namespace: "math",
                signature:
                    "math.noise(x: number, y?: number, z?: number) -> number",
            },
        ),
        createItem(
            "pi",
            "constant",
            "math constant",
            "Pi constant.",
            LUAU_DOC_SOURCE,
            { namespace: "math" },
        ),
        createItem(
            "pow",
            "function",
            "math function",
            "Raise a number to a power.",
            LUAU_DOC_SOURCE,
            {
                namespace: "math",
                signature: "math.pow(x: number, y: number) -> number",
            },
        ),
        createItem(
            "rad",
            "function",
            "math function",
            "Convert degrees to radians.",
            LUAU_DOC_SOURCE,
            { namespace: "math", signature: "math.rad(x: number) -> number" },
        ),
        createItem(
            "random",
            "function",
            "math function",
            "Return a pseudo-random number.",
            LUAU_DOC_SOURCE,
            {
                namespace: "math",
                signature: "math.random(min?: number, max?: number) -> number",
            },
        ),
        createItem(
            "randomseed",
            "function",
            "math function",
            "Seed the pseudo-random number generator.",
            LUAU_DOC_SOURCE,
            {
                namespace: "math",
                signature: "math.randomseed(seed: number) -> ()",
            },
        ),
        createItem(
            "round",
            "function",
            "math function",
            "Round to the nearest integer.",
            ROBLOX_DOC_SOURCE,
            { namespace: "math", signature: "math.round(x: number) -> number" },
        ),
        createItem(
            "sign",
            "function",
            "math function",
            "Return -1, 0, or 1 based on number sign.",
            ROBLOX_DOC_SOURCE,
            { namespace: "math", signature: "math.sign(x: number) -> number" },
        ),
        createItem(
            "sin",
            "function",
            "math function",
            "Return sine.",
            LUAU_DOC_SOURCE,
            { namespace: "math", signature: "math.sin(x: number) -> number" },
        ),
        createItem(
            "sqrt",
            "function",
            "math function",
            "Return square root.",
            LUAU_DOC_SOURCE,
            { namespace: "math", signature: "math.sqrt(x: number) -> number" },
        ),
        createItem(
            "tan",
            "function",
            "math function",
            "Return tangent.",
            LUAU_DOC_SOURCE,
            { namespace: "math", signature: "math.tan(x: number) -> number" },
        ),
    ]),
    createNamespaceGroup("string", [
        createItem(
            "byte",
            "function",
            "string function",
            "Return the numeric codepoints at a position range.",
            LUAU_DOC_SOURCE,
            {
                namespace: "string",
                signature:
                    "string.byte(s: string, i?: number, j?: number) -> ...number",
            },
        ),
        createItem(
            "char",
            "function",
            "string function",
            "Build a string from codepoints.",
            LUAU_DOC_SOURCE,
            {
                namespace: "string",
                signature: "string.char(...number) -> string",
            },
        ),
        createItem(
            "find",
            "function",
            "string function",
            "Find a pattern or substring in a string.",
            LUAU_DOC_SOURCE,
            {
                namespace: "string",
                signature:
                    "string.find(s: string, pattern: string, init?: number, plain?: boolean) -> (number?, number?)",
            },
        ),
        createItem(
            "format",
            "function",
            "string function",
            "Format values into a string.",
            LUAU_DOC_SOURCE,
            {
                namespace: "string",
                signature: "string.format(format: string, ...any) -> string",
            },
        ),
        createItem(
            "gmatch",
            "function",
            "string function",
            "Iterate over pattern matches.",
            LUAU_DOC_SOURCE,
            {
                namespace: "string",
                signature:
                    "string.gmatch(s: string, pattern: string) -> iterator",
            },
        ),
        createItem(
            "gsub",
            "function",
            "string function",
            "Replace pattern matches in a string.",
            LUAU_DOC_SOURCE,
            {
                namespace: "string",
                signature:
                    "string.gsub(s: string, pattern: string, repl: any, n?: number) -> (string, number)",
            },
        ),
        createItem(
            "len",
            "function",
            "string function",
            "Return string length in bytes.",
            LUAU_DOC_SOURCE,
            {
                namespace: "string",
                signature: "string.len(s: string) -> number",
            },
        ),
        createItem(
            "lower",
            "function",
            "string function",
            "Lowercase a string.",
            LUAU_DOC_SOURCE,
            {
                namespace: "string",
                signature: "string.lower(s: string) -> string",
            },
        ),
        createItem(
            "match",
            "function",
            "string function",
            "Return the first pattern match.",
            LUAU_DOC_SOURCE,
            {
                namespace: "string",
                signature:
                    "string.match(s: string, pattern: string, init?: number) -> ...string",
            },
        ),
        createItem(
            "pack",
            "function",
            "string function",
            "Pack values according to a binary format string.",
            LUAU_DOC_SOURCE,
            {
                namespace: "string",
                signature: "string.pack(format: string, ...any) -> string",
            },
        ),
        createItem(
            "packsize",
            "function",
            "string function",
            "Return the packed byte size for a format string.",
            LUAU_DOC_SOURCE,
            {
                namespace: "string",
                signature: "string.packsize(format: string) -> number",
            },
        ),
        createItem(
            "rep",
            "function",
            "string function",
            "Repeat a string a number of times.",
            LUAU_DOC_SOURCE,
            {
                namespace: "string",
                signature:
                    "string.rep(s: string, n: number, sep?: string) -> string",
            },
        ),
        createItem(
            "reverse",
            "function",
            "string function",
            "Reverse a string.",
            LUAU_DOC_SOURCE,
            {
                namespace: "string",
                signature: "string.reverse(s: string) -> string",
            },
        ),
        createItem(
            "sub",
            "function",
            "string function",
            "Slice a string with start and end positions.",
            LUAU_DOC_SOURCE,
            {
                namespace: "string",
                signature:
                    "string.sub(s: string, i: number, j?: number) -> string",
            },
        ),
        createItem(
            "unpack",
            "function",
            "string function",
            "Unpack a binary string according to a format string.",
            LUAU_DOC_SOURCE,
            {
                namespace: "string",
                signature:
                    "string.unpack(format: string, data: string, pos?: number) -> ...any",
            },
        ),
        createItem(
            "upper",
            "function",
            "string function",
            "Uppercase a string.",
            LUAU_DOC_SOURCE,
            {
                namespace: "string",
                signature: "string.upper(s: string) -> string",
            },
        ),
    ]),
    createNamespaceGroup("table", [
        createItem(
            "clear",
            "function",
            "table function",
            "Remove all keys from a table.",
            ROBLOX_DOC_SOURCE,
            { namespace: "table", signature: "table.clear(t: table) -> ()" },
        ),
        createItem(
            "clone",
            "function",
            "table function",
            "Shallow-clone a table.",
            ROBLOX_DOC_SOURCE,
            { namespace: "table", signature: "table.clone(t: table) -> table" },
        ),
        createItem(
            "concat",
            "function",
            "table function",
            "Concatenate sequential string values.",
            LUAU_DOC_SOURCE,
            {
                namespace: "table",
                signature:
                    "table.concat(list: table, sep?: string, i?: number, j?: number) -> string",
            },
        ),
        createItem(
            "create",
            "function",
            "table function",
            "Create a pre-sized array-like table.",
            LUAU_DOC_SOURCE,
            {
                namespace: "table",
                signature: "table.create(count: number, value?: any) -> table",
            },
        ),
        createItem(
            "find",
            "function",
            "table function",
            "Find the first numeric index containing a value.",
            LUAU_DOC_SOURCE,
            {
                namespace: "table",
                signature:
                    "table.find(list: table, value: any, init?: number) -> number?",
            },
        ),
        createItem(
            "freeze",
            "function",
            "table function",
            "Freeze a table to prevent further mutation.",
            ROBLOX_DOC_SOURCE,
            {
                namespace: "table",
                signature: "table.freeze(t: table) -> table",
            },
        ),
        createItem(
            "insert",
            "function",
            "table function",
            "Insert a value into an array-like table.",
            LUAU_DOC_SOURCE,
            {
                namespace: "table",
                signature:
                    "table.insert(list: table, posOrValue: any, value?: any) -> ()",
            },
        ),
        createItem(
            "isfrozen",
            "function",
            "table function",
            "Check if a table is frozen.",
            ROBLOX_DOC_SOURCE,
            {
                namespace: "table",
                signature: "table.isfrozen(t: table) -> boolean",
            },
        ),
        createItem(
            "move",
            "function",
            "table function",
            "Move a range of values between tables.",
            LUAU_DOC_SOURCE,
            {
                namespace: "table",
                signature:
                    "table.move(a1: table, f: number, e: number, t: number, a2?: table) -> table",
            },
        ),
        createItem(
            "pack",
            "function",
            "table function",
            "Pack arguments into a table and preserve count in .n.",
            LUAU_DOC_SOURCE,
            { namespace: "table", signature: "table.pack(...any) -> table" },
        ),
        createItem(
            "remove",
            "function",
            "table function",
            "Remove an element from an array-like table.",
            LUAU_DOC_SOURCE,
            {
                namespace: "table",
                signature: "table.remove(list: table, pos?: number) -> any",
            },
        ),
        createItem(
            "sort",
            "function",
            "table function",
            "Sort an array-like table in place.",
            LUAU_DOC_SOURCE,
            {
                namespace: "table",
                signature:
                    "table.sort(list: table, comp?: (a: any, b: any) -> boolean) -> ()",
            },
        ),
        createItem(
            "unpack",
            "function",
            "table function",
            "Expand sequential values into multiple results.",
            LUAU_DOC_SOURCE,
            {
                namespace: "table",
                signature:
                    "table.unpack(list: table, i?: number, j?: number) -> ...any",
            },
        ),
    ]),
    createNamespaceGroup("coroutine", [
        createItem(
            "close",
            "function",
            "coroutine function",
            "Close a suspended coroutine.",
            LUAU_DOC_SOURCE,
            {
                namespace: "coroutine",
                signature: "coroutine.close(co: thread) -> (boolean, any?)",
            },
        ),
        createItem(
            "create",
            "function",
            "coroutine function",
            "Create a new coroutine.",
            LUAU_DOC_SOURCE,
            {
                namespace: "coroutine",
                signature: "coroutine.create(fn: (...any) -> ...any) -> thread",
            },
        ),
        createItem(
            "isyieldable",
            "function",
            "coroutine function",
            "Check whether the running coroutine can yield.",
            LUAU_DOC_SOURCE,
            {
                namespace: "coroutine",
                signature: "coroutine.isyieldable() -> boolean",
            },
        ),
        createItem(
            "resume",
            "function",
            "coroutine function",
            "Resume a coroutine.",
            LUAU_DOC_SOURCE,
            {
                namespace: "coroutine",
                signature:
                    "coroutine.resume(co: thread, ...any) -> (boolean, ...any)",
            },
        ),
        createItem(
            "running",
            "function",
            "coroutine function",
            "Return the currently running coroutine.",
            LUAU_DOC_SOURCE,
            {
                namespace: "coroutine",
                signature: "coroutine.running() -> thread?",
            },
        ),
        createItem(
            "status",
            "function",
            "coroutine function",
            "Return coroutine status.",
            LUAU_DOC_SOURCE,
            {
                namespace: "coroutine",
                signature: "coroutine.status(co: thread) -> string",
            },
        ),
        createItem(
            "wrap",
            "function",
            "coroutine function",
            "Wrap a function so coroutine resume errors are rethrown.",
            LUAU_DOC_SOURCE,
            {
                namespace: "coroutine",
                signature:
                    "coroutine.wrap(fn: (...any) -> ...any) -> (...any) -> ...any",
            },
        ),
        createItem(
            "yield",
            "function",
            "coroutine function",
            "Yield execution from the current coroutine.",
            LUAU_DOC_SOURCE,
            {
                namespace: "coroutine",
                signature: "coroutine.yield(...any) -> ...any",
            },
        ),
    ]),
    createNamespaceGroup("utf8", [
        createItem(
            "char",
            "function",
            "utf8 function",
            "Build a UTF-8 string from codepoints.",
            LUAU_DOC_SOURCE,
            { namespace: "utf8", signature: "utf8.char(...number) -> string" },
        ),
        createItem(
            "codepoint",
            "function",
            "utf8 function",
            "Return UTF-8 codepoints from a string range.",
            LUAU_DOC_SOURCE,
            {
                namespace: "utf8",
                signature:
                    "utf8.codepoint(s: string, i?: number, j?: number) -> ...number",
            },
        ),
        createItem(
            "codes",
            "function",
            "utf8 function",
            "Iterate over UTF-8 codepoints and byte offsets.",
            LUAU_DOC_SOURCE,
            {
                namespace: "utf8",
                signature: "utf8.codes(s: string) -> iterator",
            },
        ),
        createItem(
            "len",
            "function",
            "utf8 function",
            "Return UTF-8 codepoint length.",
            LUAU_DOC_SOURCE,
            {
                namespace: "utf8",
                signature:
                    "utf8.len(s: string, i?: number, j?: number) -> number?",
            },
        ),
        createItem(
            "offset",
            "function",
            "utf8 function",
            "Return the byte offset of a UTF-8 codepoint.",
            LUAU_DOC_SOURCE,
            {
                namespace: "utf8",
                signature:
                    "utf8.offset(s: string, n: number, i?: number) -> number?",
            },
        ),
    ]),
    createNamespaceGroup("bit32", [
        createItem(
            "arshift",
            "function",
            "bit32 function",
            "Arithmetic right shift.",
            LUAU_DOC_SOURCE,
            {
                namespace: "bit32",
                signature: "bit32.arshift(x: number, disp: number) -> number",
            },
        ),
        createItem(
            "band",
            "function",
            "bit32 function",
            "Bitwise and.",
            LUAU_DOC_SOURCE,
            {
                namespace: "bit32",
                signature: "bit32.band(...number) -> number",
            },
        ),
        createItem(
            "bnot",
            "function",
            "bit32 function",
            "Bitwise not.",
            LUAU_DOC_SOURCE,
            {
                namespace: "bit32",
                signature: "bit32.bnot(x: number) -> number",
            },
        ),
        createItem(
            "bor",
            "function",
            "bit32 function",
            "Bitwise or.",
            LUAU_DOC_SOURCE,
            { namespace: "bit32", signature: "bit32.bor(...number) -> number" },
        ),
        createItem(
            "bxor",
            "function",
            "bit32 function",
            "Bitwise xor.",
            LUAU_DOC_SOURCE,
            {
                namespace: "bit32",
                signature: "bit32.bxor(...number) -> number",
            },
        ),
        createItem(
            "extract",
            "function",
            "bit32 function",
            "Extract a bitfield.",
            LUAU_DOC_SOURCE,
            {
                namespace: "bit32",
                signature:
                    "bit32.extract(n: number, field: number, width?: number) -> number",
            },
        ),
        createItem(
            "lrotate",
            "function",
            "bit32 function",
            "Rotate bits left.",
            LUAU_DOC_SOURCE,
            {
                namespace: "bit32",
                signature: "bit32.lrotate(x: number, disp: number) -> number",
            },
        ),
        createItem(
            "lshift",
            "function",
            "bit32 function",
            "Logical left shift.",
            LUAU_DOC_SOURCE,
            {
                namespace: "bit32",
                signature: "bit32.lshift(x: number, disp: number) -> number",
            },
        ),
        createItem(
            "replace",
            "function",
            "bit32 function",
            "Replace a bitfield.",
            LUAU_DOC_SOURCE,
            {
                namespace: "bit32",
                signature:
                    "bit32.replace(n: number, v: number, field: number, width?: number) -> number",
            },
        ),
        createItem(
            "rrotate",
            "function",
            "bit32 function",
            "Rotate bits right.",
            LUAU_DOC_SOURCE,
            {
                namespace: "bit32",
                signature: "bit32.rrotate(x: number, disp: number) -> number",
            },
        ),
        createItem(
            "rshift",
            "function",
            "bit32 function",
            "Logical right shift.",
            LUAU_DOC_SOURCE,
            {
                namespace: "bit32",
                signature: "bit32.rshift(x: number, disp: number) -> number",
            },
        ),
    ]),
    createNamespaceGroup("buffer", [
        createItem(
            "create",
            "function",
            "buffer function",
            "Allocate a new byte buffer.",
            LUAU_DOC_SOURCE,
            {
                namespace: "buffer",
                signature: "buffer.create(size: number) -> buffer",
            },
        ),
        createItem(
            "copy",
            "function",
            "buffer function",
            "Copy bytes between buffers.",
            LUAU_DOC_SOURCE,
            {
                namespace: "buffer",
                signature:
                    "buffer.copy(target: buffer, targetOffset: number, source: buffer, sourceOffset?: number, count?: number) -> ()",
            },
        ),
        createItem(
            "fill",
            "function",
            "buffer function",
            "Fill a range of bytes with a value.",
            LUAU_DOC_SOURCE,
            {
                namespace: "buffer",
                signature:
                    "buffer.fill(target: buffer, offset: number, value: number, count?: number) -> ()",
            },
        ),
        createItem(
            "fromstring",
            "function",
            "buffer function",
            "Create a buffer from a string.",
            LUAU_DOC_SOURCE,
            {
                namespace: "buffer",
                signature: "buffer.fromstring(value: string) -> buffer",
            },
        ),
        createItem(
            "len",
            "function",
            "buffer function",
            "Return buffer size in bytes.",
            LUAU_DOC_SOURCE,
            {
                namespace: "buffer",
                signature: "buffer.len(value: buffer) -> number",
            },
        ),
        createItem(
            "readf32",
            "function",
            "buffer function",
            "Read a 32-bit float.",
            LUAU_DOC_SOURCE,
            {
                namespace: "buffer",
                signature:
                    "buffer.readf32(value: buffer, offset: number) -> number",
            },
        ),
        createItem(
            "readf64",
            "function",
            "buffer function",
            "Read a 64-bit float.",
            LUAU_DOC_SOURCE,
            {
                namespace: "buffer",
                signature:
                    "buffer.readf64(value: buffer, offset: number) -> number",
            },
        ),
        createItem(
            "readi16",
            "function",
            "buffer function",
            "Read a signed 16-bit integer.",
            LUAU_DOC_SOURCE,
            {
                namespace: "buffer",
                signature:
                    "buffer.readi16(value: buffer, offset: number) -> number",
            },
        ),
        createItem(
            "readi32",
            "function",
            "buffer function",
            "Read a signed 32-bit integer.",
            LUAU_DOC_SOURCE,
            {
                namespace: "buffer",
                signature:
                    "buffer.readi32(value: buffer, offset: number) -> number",
            },
        ),
        createItem(
            "readi8",
            "function",
            "buffer function",
            "Read a signed 8-bit integer.",
            LUAU_DOC_SOURCE,
            {
                namespace: "buffer",
                signature:
                    "buffer.readi8(value: buffer, offset: number) -> number",
            },
        ),
        createItem(
            "readu16",
            "function",
            "buffer function",
            "Read an unsigned 16-bit integer.",
            LUAU_DOC_SOURCE,
            {
                namespace: "buffer",
                signature:
                    "buffer.readu16(value: buffer, offset: number) -> number",
            },
        ),
        createItem(
            "readu32",
            "function",
            "buffer function",
            "Read an unsigned 32-bit integer.",
            LUAU_DOC_SOURCE,
            {
                namespace: "buffer",
                signature:
                    "buffer.readu32(value: buffer, offset: number) -> number",
            },
        ),
        createItem(
            "readu8",
            "function",
            "buffer function",
            "Read an unsigned 8-bit integer.",
            LUAU_DOC_SOURCE,
            {
                namespace: "buffer",
                signature:
                    "buffer.readu8(value: buffer, offset: number) -> number",
            },
        ),
        createItem(
            "tostring",
            "function",
            "buffer function",
            "Convert a byte buffer to a string.",
            LUAU_DOC_SOURCE,
            {
                namespace: "buffer",
                signature: "buffer.tostring(value: buffer) -> string",
            },
        ),
        createItem(
            "writef32",
            "function",
            "buffer function",
            "Write a 32-bit float.",
            LUAU_DOC_SOURCE,
            {
                namespace: "buffer",
                signature:
                    "buffer.writef32(value: buffer, offset: number, input: number) -> ()",
            },
        ),
        createItem(
            "writef64",
            "function",
            "buffer function",
            "Write a 64-bit float.",
            LUAU_DOC_SOURCE,
            {
                namespace: "buffer",
                signature:
                    "buffer.writef64(value: buffer, offset: number, input: number) -> ()",
            },
        ),
        createItem(
            "writei16",
            "function",
            "buffer function",
            "Write a signed 16-bit integer.",
            LUAU_DOC_SOURCE,
            {
                namespace: "buffer",
                signature:
                    "buffer.writei16(value: buffer, offset: number, input: number) -> ()",
            },
        ),
        createItem(
            "writei32",
            "function",
            "buffer function",
            "Write a signed 32-bit integer.",
            LUAU_DOC_SOURCE,
            {
                namespace: "buffer",
                signature:
                    "buffer.writei32(value: buffer, offset: number, input: number) -> ()",
            },
        ),
        createItem(
            "writei8",
            "function",
            "buffer function",
            "Write a signed 8-bit integer.",
            LUAU_DOC_SOURCE,
            {
                namespace: "buffer",
                signature:
                    "buffer.writei8(value: buffer, offset: number, input: number) -> ()",
            },
        ),
        createItem(
            "writeu16",
            "function",
            "buffer function",
            "Write an unsigned 16-bit integer.",
            LUAU_DOC_SOURCE,
            {
                namespace: "buffer",
                signature:
                    "buffer.writeu16(value: buffer, offset: number, input: number) -> ()",
            },
        ),
        createItem(
            "writeu32",
            "function",
            "buffer function",
            "Write an unsigned 32-bit integer.",
            LUAU_DOC_SOURCE,
            {
                namespace: "buffer",
                signature:
                    "buffer.writeu32(value: buffer, offset: number, input: number) -> ()",
            },
        ),
        createItem(
            "writeu8",
            "function",
            "buffer function",
            "Write an unsigned 8-bit integer.",
            LUAU_DOC_SOURCE,
            {
                namespace: "buffer",
                signature:
                    "buffer.writeu8(value: buffer, offset: number, input: number) -> ()",
            },
        ),
    ]),
];
