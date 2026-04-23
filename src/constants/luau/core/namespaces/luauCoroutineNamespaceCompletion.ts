import {
    createLuauLanguageCompletionItem as createItem,
    createLuauNamespaceCompletionGroup as createNamespaceGroup,
} from "../../../../lib/luau/completion/completionBuilder";
import type { LuauNamespaceCompletionGroup } from "../../../../lib/luau/luau.type";
import { LUAU_DOC_SOURCE } from "../luauCompletionSources";

export const LUAU_COROUTINE_NAMESPACE_COMPLETION: LuauNamespaceCompletionGroup =
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
    ]);
