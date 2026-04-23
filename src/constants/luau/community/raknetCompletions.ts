import {
    createLuauCompletionItem,
    createLuauNamespaceCompletionGroup,
    normalizeLuauMarkdownSummary,
} from "../../../lib/luau/completion/completionBuilder";
import type {
    LuauCompletionItem,
    LuauNamespaceCompletionGroup,
} from "../../../lib/luau/luau.type";
import type {
    NamespaceDataEntry,
    TopLevelDataEntry,
} from "./raknetCompletions.type";

const RAKNET_DOC_SOURCE = "Actors Documentation";

const RAKNET_TOP_LEVEL_DATA = [
    [
        "raknet",
        "Low-level packet interception and sending helpers for outgoing game traffic.",
        "namespace raknet",
        "https://docs.volt.bz/docs/raknet",
    ],
] as const satisfies readonly TopLevelDataEntry[];

const RAKNET_NAMESPACE_DATA = [
    [
        "raknet",
        "add_send_hook",
        "Registers a callback that runs before a packet is sent. The hook receives a RakNetPacket that exposes AsBuffer, AsString, AsArray, Priority, Reliability, OrderingChannel, and Size, and can call SetData or Block.",
        "raknet.add_send_hook(hook: (packet: RakNetPacket) -> ()) -> ()",
        "https://docs.volt.bz/docs/raknet",
    ],
    [
        "raknet",
        "remove_send_hook",
        "Removes a callback previously registered with raknet.add_send_hook.",
        "raknet.remove_send_hook(hook: (packet: RakNetPacket) -> ()) -> ()",
        "https://docs.volt.bz/docs/raknet",
    ],
    [
        "raknet",
        "send",
        "Sends a custom packet payload with a priority, reliability mode, and ordering channel. Payloads can be passed as a buffer, string, or byte array.",
        "raknet.send(data: buffer | string | {number}, priority: number, reliability: number, ordering_channel: number) -> ()",
        "https://docs.volt.bz/docs/raknet",
    ],
] as const satisfies readonly NamespaceDataEntry[];

export const RAKNET_NAMESPACE_NAMES = ["raknet"] as const;

export const RAKNET_NAMESPACE_FUNCTION_NAMES = RAKNET_NAMESPACE_DATA.map(
    ([, memberName]) => memberName,
);

export const RAKNET_TOP_LEVEL_COMPLETIONS: LuauCompletionItem[] = [
    ...RAKNET_TOP_LEVEL_DATA.map(([label, summary, signature, link]) =>
        createLuauCompletionItem(label, summary, {
            detail: "ranket",
            kind: "namespace",
            score: 1160,
            signature,
            source: RAKNET_DOC_SOURCE,
            sourceGroup: "executor",
            sourceLink: link,
            summaryNormalizer: normalizeLuauMarkdownSummary,
        }),
    ),
];

export const RAKNET_NAMESPACE_COMPLETIONS: LuauNamespaceCompletionGroup[] = [
    createLuauNamespaceCompletionGroup(
        "raknet",
        RAKNET_NAMESPACE_DATA.map(
            ([namespace, memberName, summary, signature, link]) =>
                createLuauCompletionItem(memberName, summary, {
                    detail: "ranket",
                    kind: "function",
                    namespace,
                    score: 1150,
                    signature,
                    source: RAKNET_DOC_SOURCE,
                    sourceGroup: "executor",
                    sourceLink: link,
                    summaryNormalizer: normalizeLuauMarkdownSummary,
                }),
        ),
    ),
];
