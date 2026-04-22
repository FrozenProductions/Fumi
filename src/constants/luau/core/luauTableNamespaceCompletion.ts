import {
    createLuauLanguageCompletionItem as createItem,
    createLuauNamespaceCompletionGroup as createNamespaceGroup,
} from "../../../lib/luau/completionBuilder";
import type { LuauNamespaceCompletionGroup } from "../../../lib/luau/luau.type";
import { LUAU_DOC_SOURCE, ROBLOX_DOC_SOURCE } from "./luauCompletionSources";

export const LUAU_TABLE_NAMESPACE_COMPLETION: LuauNamespaceCompletionGroup =
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
    ]);
