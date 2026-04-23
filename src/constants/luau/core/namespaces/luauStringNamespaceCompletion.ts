import {
    createLuauLanguageCompletionItem as createItem,
    createLuauNamespaceCompletionGroup as createNamespaceGroup,
} from "../../../../lib/luau/completion/completionBuilder";
import type { LuauNamespaceCompletionGroup } from "../../../../lib/luau/luau.type";
import { LUAU_DOC_SOURCE } from "../luauCompletionSources";

export const LUAU_STRING_NAMESPACE_COMPLETION: LuauNamespaceCompletionGroup =
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
    ]);
