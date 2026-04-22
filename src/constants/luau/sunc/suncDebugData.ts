import type { SuncDebugDataEntry } from "./suncCompletions.type";

export const SUNC_DEBUG_DATA = [
    [
        "getconstant",
        "debug.getconstant returns the constant at the specified index from a Luau function. If no constant exists at that index, it returns nil instead.",
        "function debug.getconstant(func: (...any) -> (...any) | number, index: number): number | string | boolean | nil",
        "https://docs.sunc.su/Debug/getconstant",
    ],
    [
        "getconstants",
        "debug.getconstants returns a list of all constants used within a Luau function's bytecode. This includes literal values like numbers, strings, booleans, and nil.",
        "function debug.getconstants(func: (...any) -> (...any) | number): { number | string | boolean | nil }",
        "https://docs.sunc.su/Debug/getconstants",
    ],
    [
        "getproto",
        "debug.getproto returns a specific function prototype from a Luau function by index. Optionally, it can search for active functions of the proto.",
        "function debug.getproto(func: (...any) -> (...any) | number, index: number, activated: boolean?): (...any) -> (...any) | { (...any) -> (...any) }",
        "https://docs.sunc.su/Debug/getproto",
    ],
    [
        "getprotos",
        "debug.getprotos returns all function prototypes defined within the specified Luau function.",
        "function debug.getprotos(func: (...any) -> (...any) | number): { (...any) -> (...any) }",
        "https://docs.sunc.su/Debug/getprotos",
    ],
    [
        "getstack",
        "debug.getstack retrieves values from the stack at the specified call level.",
        "function debug.getstack(level: number, index: number?): any | { any }",
        "https://docs.sunc.su/Debug/getstack",
    ],
    [
        "getupvalue",
        "debug.getupvalue returns the upvalue at the specified index from a Luau function's closure. If the index is invalid or out of bounds, an error will occur.",
        "function debug.getupvalue(func: (...any) -> (...any) | number, index: number): any",
        "https://docs.sunc.su/Debug/getupvalue",
    ],
    [
        "getupvalues",
        "debug.getupvalues returns a list of upvalues captured by a Luau function. These are the external variables that a function closes over from its surrounding scope.",
        "function debug.getupvalues(func: (...any) -> (...any) | number): { any }",
        "https://docs.sunc.su/Debug/getupvalues",
    ],
    [
        "setconstant",
        "debug.setconstant modifies a constant at the specified index in a Luau function bytecode.",
        "function debug.setconstant(func: (...any) -> (...any) | number, index: number, value: number | string | boolean | nil): ()",
        "https://docs.sunc.su/Debug/setconstant",
    ],
    [
        "setstack",
        "debug.setstack replaces a value in a specified stack frame.",
        "function debug.setstack(level: number, index: number, value: any): ()",
        "https://docs.sunc.su/Debug/setstack",
    ],
    [
        "setupvalue",
        "debug.setupvalue replaces an upvalue at the specified index in a Luau function, with a new value.",
        "function debug.setupvalue(func: (...any) -> (...any) | number, index: number, value: any): ()",
        "https://docs.sunc.su/Debug/setupvalue",
    ],
] as const satisfies readonly SuncDebugDataEntry[];
