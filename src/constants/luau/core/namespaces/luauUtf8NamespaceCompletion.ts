import {
    createLuauLanguageCompletionItem as createItem,
    createLuauNamespaceCompletionGroup as createNamespaceGroup,
} from "../../../../lib/luau/completion/completionBuilder";
import type { LuauNamespaceCompletionGroup } from "../../../../lib/luau/luau.type";
import { LUAU_DOC_SOURCE } from "../luauCompletionSources";

export const LUAU_UTF8_NAMESPACE_COMPLETION: LuauNamespaceCompletionGroup =
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
    ]);
