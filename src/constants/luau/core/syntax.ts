export const LUAU_CONTROL_KEYWORDS = [
    "and",
    "break",
    "continue",
    "do",
    "else",
    "elseif",
    "end",
    "for",
    "function",
    "if",
    "in",
    "local",
    "not",
    "or",
    "repeat",
    "return",
    "then",
    "until",
    "while",
] as const;

export const LUAU_DECLARATION_KEYWORDS = ["as", "export", "typeof"] as const;

export const LUAU_BUILTIN_TYPES = [
    "any",
    "boolean",
    "buffer",
    "function",
    "nil",
    "number",
    "string",
    "table",
    "thread",
    "unknown",
    "userdata",
    "vector",
    "never",
] as const;

export const LUAU_BUILTIN_CONSTANTS = [
    "_G",
    "_VERSION",
    "false",
    "nil",
    "true",
] as const;

export const LUAU_GLOBAL_FUNCTION_NAMES = [
    "assert",
    "error",
    "getmetatable",
    "ipairs",
    "next",
    "pairs",
    "pcall",
    "print",
    "raweq",
    "rawget",
    "rawlen",
    "rawset",
    "select",
    "setmetatable",
    "tonumber",
    "tostring",
    "type",
    "typeof",
    "unpack",
    "warn",
    "xpcall",
] as const;

export const LUAU_LIBRARY_NAMES = [
    "bit32",
    "buffer",
    "coroutine",
    "math",
    "os",
    "string",
    "table",
    "utf8",
] as const;

export const LUAU_ROBLOX_NAMESPACE_NAMES = [
    "Enum",
    "Instance",
    "task",
] as const;

export const LUAU_COMPLETION_KEYWORDS = [
    ...LUAU_CONTROL_KEYWORDS,
    ...LUAU_DECLARATION_KEYWORDS,
] as const;
