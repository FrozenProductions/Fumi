import {
    createLuauLanguageCompletionItem as createItem,
    createLuauNamespaceCompletionGroup as createNamespaceGroup,
} from "../../../../lib/luau/completion/completionBuilder";
import type { LuauNamespaceCompletionGroup } from "../../../../lib/luau/luau.type";
import { LUAU_DOC_SOURCE } from "../luauCompletionSources";

export const LUAU_BUFFER_NAMESPACE_COMPLETION: LuauNamespaceCompletionGroup =
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
    ]);
