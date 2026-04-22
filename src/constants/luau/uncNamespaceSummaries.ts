import type { TopLevelDataEntry } from "./uncCompletions.type";

export const UNC_NAMESPACE_SUMMARIES = [
    [
        "Drawing",
        "Drawing",
        "Create drawing objects and inspect the UNC drawing font table.",
        "namespace Drawing",
        "https://github.com/unified-naming-convention/NamingStandard/blob/main/api/Drawing.md",
    ],
    [
        "WebSocket",
        "WebSocket",
        "Establish UNC WebSocket connections.",
        "namespace WebSocket",
        "https://github.com/unified-naming-convention/NamingStandard/blob/main/api/WebSocket.md",
    ],
    [
        "cache",
        "cache",
        "Work with UNC instance-cache helpers.",
        "namespace cache",
        "https://github.com/unified-naming-convention/NamingStandard/blob/main/api/cache.md",
    ],
    [
        "crypt",
        "crypt",
        "Use UNC crypt helpers for Base64, AES, hashing, and key generation.",
        "namespace crypt",
        "https://github.com/unified-naming-convention/NamingStandard/blob/main/api/crypt.md",
    ],
    [
        "debug",
        "debug",
        "Use the UNC extended debug helpers.",
        "namespace debug",
        "https://github.com/unified-naming-convention/NamingStandard/blob/main/api/debug.md",
    ],
    [
        "base64",
        "crypt",
        "Use the UNC base64 alias namespace.",
        "namespace base64",
        "https://github.com/unified-naming-convention/NamingStandard/blob/main/api/crypt.md",
    ],
    [
        "http",
        "misc",
        "Use the UNC HTTP alias namespace.",
        "namespace http",
        "https://github.com/unified-naming-convention/NamingStandard/blob/main/api/misc.md",
    ],
] as const satisfies readonly TopLevelDataEntry[];
