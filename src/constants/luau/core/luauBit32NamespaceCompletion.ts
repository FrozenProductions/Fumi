import {
    createLuauLanguageCompletionItem as createItem,
    createLuauNamespaceCompletionGroup as createNamespaceGroup,
} from "../../../lib/luau/completionBuilder";
import type { LuauNamespaceCompletionGroup } from "../../../lib/luau/luau.type";
import { LUAU_DOC_SOURCE } from "./luauCompletionSources";

export const LUAU_BIT32_NAMESPACE_COMPLETION: LuauNamespaceCompletionGroup =
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
    ]);
