import {
    createLuauLanguageCompletionItem as createItem,
    createLuauNamespaceCompletionGroup as createNamespaceGroup,
} from "../../lib/luau/completionBuilder";
import type { LuauNamespaceCompletionGroup } from "../../lib/luau/luau.type";
import { ROBLOX_DOC_SOURCE } from "./robloxCompletionSources";

export const ROBLOX_INSTANCE_NAMESPACE_COMPLETION: LuauNamespaceCompletionGroup =
    createNamespaceGroup("Instance", [
        createItem(
            "new",
            "function",
            "constructor",
            "Create a new Roblox instance by class name.",
            ROBLOX_DOC_SOURCE,
            {
                namespace: "Instance",
                signature:
                    "Instance.new(className: string, parent?: Instance) -> Instance",
            },
        ),
    ]);
