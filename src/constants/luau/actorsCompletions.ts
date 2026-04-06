import {
    createLuauCompletionAliasItem,
    createLuauCompletionItem,
    normalizeLuauMarkdownSummary,
} from "../../lib/luau/completionBuilder";
import type { LuauCompletionItem } from "../../lib/luau/luau.type";
import type {
    AliasDataEntry,
    TopLevelDataEntry,
} from "./actorsCompletions.type";

const ACTORS_DOC_SOURCE = "Actors Documentation";

const ACTORS_TOP_LEVEL_DATA = [
    [
        "create_comm_channel",
        "Creates a communication channel for sending messages between actors and the main thread.",
        "create_comm_channel(name: string?) -> (string, Channel)",
        "https://docs.volt.bz/docs/actors/create_comm_channel",
    ],
    [
        "get_comm_channel",
        "Gets an existing communication channel by identifier.",
        "get_comm_channel(id: string) -> Channel",
        "https://docs.volt.bz/docs/actors/get_comm_channel",
    ],
    [
        "getactors",
        "Gets all actors in the game.",
        "getactors() -> {Actor}",
        "https://docs.volt.bz/docs/actors/getactors",
    ],
    [
        "getactorstates",
        "Gets all active LuaStateProxy objects.",
        "getactorstates() -> {LuaStateProxy}",
        "https://docs.volt.bz/docs/actors/getactorstates",
    ],
    [
        "getgamestate",
        "Gets the default game Lua state.",
        "getgamestate() -> LuaStateProxy",
        "https://docs.volt.bz/docs/actors/getgamestate",
    ],
    [
        "getluastate",
        "Gets a LuaStateProxy for an actor or script, or resolves the current game state when omitted.",
        "getluastate(actor_or_script: (Actor | BaseScript)?) -> LuaStateProxy",
        "https://docs.volt.bz/docs/actors/getluastate",
    ],
    [
        "isparallel",
        "Checks whether the current code is running in parallel.",
        "isparallel() -> boolean",
        "https://docs.volt.bz/docs/actors/isparallel",
    ],
    [
        "on_actor_added",
        "Global event fired when an actor is ready to accept code execution.",
        "on_actor_added: BindableEvent",
        "https://docs.volt.bz/docs/actors/on_actor_added",
    ],
    [
        "on_actor_state_created",
        "Global event fired when an actor Lua state is created before any scripts execute on that state.",
        "on_actor_state_created: BindableEvent",
        "https://docs.volt.bz/docs/actors/on_actor_state_created",
    ],
    [
        "run_on_actor",
        "Runs a script string on an actor's isolated Luau state and passes additional arguments through varargs.",
        "run_on_actor(actor: Actor, script: string, ...: any) -> void",
        "https://docs.volt.bz/docs/actors/run_on_actor",
    ],
] as const satisfies readonly TopLevelDataEntry[];

const ACTORS_ALIAS_DATA = [
    [
        "get_actors",
        "getactors",
        "Gets all actors in the game.",
        "get_actors() -> {Actor}",
        "https://docs.volt.bz/docs/actors/getactors",
    ],
    [
        "is_parallel",
        "isparallel",
        "Checks whether the current code is running in parallel.",
        "is_parallel() -> boolean",
        "https://docs.volt.bz/docs/actors/isparallel",
    ],
] as const satisfies readonly AliasDataEntry[];

export const ACTORS_GLOBAL_FUNCTION_NAMES = [
    ...ACTORS_TOP_LEVEL_DATA.filter(
        ([label]) =>
            label !== "on_actor_added" && label !== "on_actor_state_created",
    ).map(([label]) => label),
    ...ACTORS_ALIAS_DATA.map(([alias]) => alias),
];

export const ACTORS_TOP_LEVEL_COMPLETIONS: LuauCompletionItem[] = [
    ...ACTORS_TOP_LEVEL_DATA.map(([label, summary, signature, link]) =>
        createLuauCompletionItem(label, summary, {
            detail: "actors",
            kind:
                label === "on_actor_added" || label === "on_actor_state_created"
                    ? "constant"
                    : "function",
            score:
                label === "on_actor_added" || label === "on_actor_state_created"
                    ? 1155
                    : 1150,
            signature,
            source: ACTORS_DOC_SOURCE,
            sourceGroup: "executor",
            sourceLink: link,
            summaryNormalizer: normalizeLuauMarkdownSummary,
        }),
    ),
    ...ACTORS_ALIAS_DATA.map(
        ([alias, canonicalName, summary, signature, link]) =>
            createLuauCompletionAliasItem(alias, canonicalName, summary, {
                detail: "actors",
                kind: "function",
                score: 1140,
                signature,
                source: ACTORS_DOC_SOURCE,
                sourceGroup: "executor",
                sourceLink: link,
                summaryNormalizer: normalizeLuauMarkdownSummary,
            }),
    ),
];
