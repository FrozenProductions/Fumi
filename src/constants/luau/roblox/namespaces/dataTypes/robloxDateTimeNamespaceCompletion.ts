import {
    createLuauLanguageCompletionItem as createItem,
    createLuauNamespaceCompletionGroup as createNamespaceGroup,
} from "../../../../../lib/luau/completion/completionBuilder";
import type { LuauNamespaceCompletionGroup } from "../../../../../lib/luau/luau.type";
import { ROBLOX_DOC_SOURCE } from "../../robloxCompletionSources";

export const ROBLOX_DATETIME_NAMESPACE_COMPLETION: LuauNamespaceCompletionGroup =
    createNamespaceGroup("DateTime", [
        createItem(
            "fromIsoDate",
            "function",
            "constructor",
            "Create a DateTime from an ISO date string.",
            ROBLOX_DOC_SOURCE,
            {
                namespace: "DateTime",
                signature: "DateTime.fromIsoDate(value: string) -> DateTime",
            },
        ),
        createItem(
            "fromLocalTime",
            "function",
            "constructor",
            "Create a DateTime from local time components.",
            ROBLOX_DOC_SOURCE,
            {
                namespace: "DateTime",
                signature:
                    "DateTime.fromLocalTime(year: number, month: number, day: number, hour?: number, minute?: number, second?: number, millisecond?: number) -> DateTime",
            },
        ),
        createItem(
            "fromUniversalTime",
            "function",
            "constructor",
            "Create a DateTime from UTC time components.",
            ROBLOX_DOC_SOURCE,
            {
                namespace: "DateTime",
                signature:
                    "DateTime.fromUniversalTime(year: number, month: number, day: number, hour?: number, minute?: number, second?: number, millisecond?: number) -> DateTime",
            },
        ),
        createItem(
            "fromUnixTimestamp",
            "function",
            "constructor",
            "Create a DateTime from a Unix timestamp.",
            ROBLOX_DOC_SOURCE,
            {
                namespace: "DateTime",
                signature:
                    "DateTime.fromUnixTimestamp(seconds: number) -> DateTime",
            },
        ),
        createItem(
            "now",
            "function",
            "constructor",
            "Return the current UTC DateTime.",
            ROBLOX_DOC_SOURCE,
            { namespace: "DateTime", signature: "DateTime.now() -> DateTime" },
        ),
    ]);
