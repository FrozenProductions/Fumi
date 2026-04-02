import type {
    LuauCompletionItem,
    LuauNamespaceCompletionGroup,
} from "../../lib/luau/luau.type";

const SUNC_DOC_SOURCE = "sUNC Documentation";

function normalizeSummary(summary: string): string {
    return summary
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/\*\*/g, "")
        .replace(/`/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function createItem(
    label: string,
    detail: string,
    summary: string,
    signature: string,
    sourceLink: string,
    options?: {
        insertText?: string;
        kind?: LuauCompletionItem["kind"];
        namespace?: string;
        score?: number;
    },
): LuauCompletionItem {
    return {
        label,
        kind: options?.kind ?? "function",
        detail,
        doc: {
            summary: `${normalizeSummary(summary)} Link: ${sourceLink}`,
            source: SUNC_DOC_SOURCE,
            signature,
        },
        insertText: options?.insertText,
        namespace: options?.namespace,
        score: options?.score,
        sourceGroup: "executor",
    };
}

function createNamespaceGroup(
    namespace: string,
    items: LuauCompletionItem[],
): LuauNamespaceCompletionGroup {
    return {
        namespace,
        items,
    };
}

const SUNC_GLOBAL_DATA = [
    [
        "appendfile",
        "Filesystem",
        "appendfile appends string content to the end of a file at the specified path. If the file does not exist, it will be created.",
        "function appendfile(path: string, contents: string): ()",
        "https://docs.sunc.su/Filesystem/appendfile",
    ],
    [
        "base64decode",
        "Encoding",
        "base64decode decodes a Base64-encoded string back into its original form.",
        "function base64decode(data: string): string",
        "https://docs.sunc.su/Encoding/base64decode",
    ],
    [
        "base64encode",
        "Encoding",
        "base64encode encodes a string with Base64 encoding.",
        "function base64encode(data: string): string",
        "https://docs.sunc.su/Encoding/base64encode",
    ],
    [
        "checkcaller",
        "Closures",
        "checkcaller returns a boolean indicating whether the current function was invoked from the executor's own thread. This is useful for differentiating between your own calls and those made by the game.",
        "function checkcaller(): boolean",
        "https://docs.sunc.su/Closures/checkcaller",
    ],
    [
        "cleardrawcache",
        "Drawing",
        "cleardrawcache removes all active drawing objects created with Drawing.new.",
        "function cleardrawcache(): ()",
        "https://docs.sunc.su/Drawing/cleardrawcache",
    ],
    [
        "clonefunction",
        "Closures",
        "clonefunction creates and returns a new function that has the exact same behaviour as the passed function.",
        "function clonefunction<A..., R...>(functionToClone: (A...) -> R...): (A...) -> R...",
        "https://docs.sunc.su/Closures/clonefunction",
    ],
    [
        "cloneref",
        "Instances",
        "cloneref returns a reference clone of an Instance. The returned object behaves identically to the original but is not strictly equal (==) to it.",
        "function cloneref<T>(object: T & Instance): T",
        "https://docs.sunc.su/Instances/cloneref",
    ],
    [
        "compareinstances",
        "Instances",
        "compareinstances checks if two Instances are equal.",
        "function compareinstances(object1: Instance, object2: Instance): boolean",
        "https://docs.sunc.su/Instances/compareinstances",
    ],
    [
        "delfile",
        "Filesystem",
        "delfile deletes the file at the specified path if it exists.",
        "function delfile(path: string): ()",
        "https://docs.sunc.su/Filesystem/delfile",
    ],
    [
        "delfolder",
        "Filesystem",
        "delfolder deletes the folder at the specified path if it exists.",
        "function delfolder(path: string): ()",
        "https://docs.sunc.su/Filesystem/delfolder",
    ],
    [
        "filtergc",
        "Environment",
        "filtergc allows you to retrieve specific garbage-collected values from Luau's memory, using fine-tuned filters.",
        'declare filtergc: (( filterType: "function", filterOptions: FunctionFilterOptions, returnOne: true) -> AnyFunction? ) & ((( filterType: "function", filterOptions: FunctionFilterOptions, returnOne: false?) -> ( AnyFunction | { AnyFunction } ) )) & (( filterType: "table", filterOptions: TableFilterOptions, returnOne: true) -> { AnyTable? } ) & (( filterType: "table", filterOptions: TableFilterOptions, returnOne: false? ) -> { AnyTable })',
        "https://docs.sunc.su/Environment/filtergc",
    ],
    [
        "fireclickdetector",
        "Instances",
        "fireclickdetector triggers a ClickDetector event. By default, it fires the MouseClick event.",
        "function fireclickdetector(detector: ClickDetector, distance: number?, event: string?): ()",
        "https://docs.sunc.su/Instances/fireclickdetector",
    ],
    [
        "fireproximityprompt",
        "Instances",
        "fireproximityprompt instantly triggers a ProximityPrompt, bypassing its HoldDuration and activation distance.",
        "function fireproximityprompt(prompt: ProximityPrompt): ()",
        "https://docs.sunc.su/Instances/fireproximityprompt",
    ],
    [
        "firesignal",
        "Signals",
        "firesignal invokes all Luau connections connected to a given RBXScriptSignal.",
        "function firesignal(signal: RBXScriptSignal, ...: any?)",
        "https://docs.sunc.su/Signals/firesignal",
    ],
    [
        "firetouchinterest",
        "Instances",
        "firetouchinterest simulates a physical touch event between two BasePart objects. It can emulate both the start and end of a Touched event.",
        "function firetouchinterest(part1: BasePart, part2: BasePart, toggle: boolean | number): ()",
        "https://docs.sunc.su/Instances/firetouchinterest",
    ],
    [
        "getcallbackvalue",
        "Instances",
        "getcallbackvalue retrieves the assigned callback property on an Instance, such as OnInvoke.",
        "function getcallbackvalue(object: Instance, property: string): any | nil",
        "https://docs.sunc.su/Instances/getcallbackvalue",
    ],
    [
        "getcallingscript",
        "Scripts",
        "getcallingscript returns the Script, LocalScript, or ModuleScript that triggered the current code execution.",
        "function getcallingscript(): BaseScript | ModuleScript | nil",
        "https://docs.sunc.su/Scripts/getcallingscript",
    ],
    [
        "getconnections",
        "Signals",
        "getconnections retrieves a list of Connection objects currently attached to a given RBXScriptSignal.",
        "function getconnections(signal: RBXScriptSignal): {Connection}",
        "https://docs.sunc.su/Signals/getconnections",
    ],
    [
        "getcustomasset",
        "Filesystem",
        "getcustomasset returns a content ID that can be used in Roblox APIs for loading audio, meshes, UI images, and other asset types.",
        "function getcustomasset(path: string): string",
        "https://docs.sunc.su/Filesystem/getcustomasset",
    ],
    [
        "getfunctionhash",
        "Closures",
        "getfunctionhash returns the hex-represented SHA384 hash of a provided function's instructions and constants.",
        "function getfunctionhash(functionToHash: (...any) -> (...any)): string",
        "https://docs.sunc.su/Closures/getfunctionhash",
    ],
    [
        "getgc",
        "Environment",
        "getgc returns a list of non-dead garbage-collectable values. These include functions, userdatas, and optionally tables.",
        "declare getgc: ((includeTables: true) -> { { AnyTable } | AnyFunction | userdata }) & ((includeTables: false?) -> { AnyFunction })",
        "https://docs.sunc.su/Environment/getgc",
    ],
    [
        "getgenv",
        "Environment",
        "getgenv returns the executor's global environment table, which is shared across all executor-made threads.",
        "function getgenv(): { any }",
        "https://docs.sunc.su/Environment/getgenv",
    ],
    [
        "gethiddenproperty",
        "Reflection",
        "gethiddenproperty retrieves the value of a hidden or non-scriptable property from a given Instance, even if it would normally throw an error when accessed directly.",
        "function gethiddenproperty(instance: Instance, property_name: string): (any, boolean)",
        "https://docs.sunc.su/Reflection/gethiddenproperty",
    ],
    [
        "gethui",
        "Instances",
        "gethui returns a hidden Instance container used for safely storing UI elements.",
        "function gethui(): BasePlayerGui | Folder",
        "https://docs.sunc.su/Instances/gethui",
    ],
    [
        "getinstances",
        "Instances",
        "getinstances retrieves every Instance from the registry, including instances that are or were parented to nil.",
        "function getinstances(): { Instance }",
        "https://docs.sunc.su/Instances/getinstances",
    ],
    [
        "getloadedmodules",
        "Scripts",
        "getloadedmodules returns a list of all ModuleScript instances that have been loaded.",
        "function getloadedmodules(): { ModuleScript }",
        "https://docs.sunc.su/Scripts/getloadedmodules",
    ],
    [
        "getnamecallmethod",
        "Metatable",
        "getnamecallmethod returns the name of the method that invoked the __namecall metamethod.",
        "function getnamecallmethod(): string?",
        "https://docs.sunc.su/Metatable/getnamecallmethod",
    ],
    [
        "getnilinstances",
        "Instances",
        "getnilinstances returns a list of Instance objects that are currently unparented.",
        "function getnilinstances(): { Instance }",
        "https://docs.sunc.su/Instances/getnilinstances",
    ],
    [
        "getrawmetatable",
        "Metatable",
        "getrawmetatable returns the raw metatable of an object, even if that object has a __metatable field set.",
        "function getrawmetatable(object: { any } | userdata): { [any]: any } | nil",
        "https://docs.sunc.su/Metatable/getrawmetatable",
    ],
    [
        "getreg",
        "Environment",
        "getreg returns the Luau registry table.",
        "function getreg(): { [any]: any }",
        "https://docs.sunc.su/Environment/getreg",
    ],
    [
        "getrenderproperty",
        "Drawing",
        "getrenderproperty retrieves the value of a property from a Drawing object.",
        "function getrenderproperty(drawing: Drawing, property: string): any",
        "https://docs.sunc.su/Drawing/getrenderproperty",
    ],
    [
        "getrenv",
        "Environment",
        "getrenv returns the Roblox global environment, which is used by the entire game.",
        "function getrenv(): { any }",
        "https://docs.sunc.su/Environment/getrenv",
    ],
    [
        "getrunningscripts",
        "Scripts",
        "getrunningscripts returns a list of all running scripts in the caller's global state.",
        "function getrunningscripts(): { BaseScript | ModuleScript }",
        "https://docs.sunc.su/Scripts/getrunningscripts",
    ],
    [
        "getscriptbytecode",
        "Scripts",
        "getscriptbytecode retrieves the bytecode of a LocalScript, ModuleScript, or Script.",
        "function getscriptbytecode(script: BaseScript | ModuleScript): string | nil",
        "https://docs.sunc.su/Scripts/getscriptbytecode",
    ],
    [
        "getscriptclosure",
        "Scripts",
        "getscriptclosure creates and returns a Luau function closure from the compiled bytecode of a Script, LocalScript, or ModuleScript.",
        "function getscriptclosure(script: BaseScript | ModuleScript): (...any) -> (...any) | nil",
        "https://docs.sunc.su/Scripts/getscriptclosure",
    ],
    [
        "getscripthash",
        "Scripts",
        "getscripthash returns a SHA-384 hash in hexadecimal format of the raw bytecode for a given script.",
        "function getscripthash(script: BaseScript | ModuleScript): string | nil",
        "https://docs.sunc.su/Scripts/getscripthash",
    ],
    [
        "getscripts",
        "Scripts",
        "getscripts returns a list of all Script, LocalScript, and ModuleScript instances present.",
        "function getscripts(): { BaseScript | ModuleScript }",
        "https://docs.sunc.su/Scripts/getscripts",
    ],
    [
        "getsenv",
        "Scripts",
        "getsenv returns the global environment table of a given Script, LocalScript, or ModuleScript.",
        "function getsenv(script: BaseScript | ModuleScript): { [any]: any } | nil",
        "https://docs.sunc.su/Scripts/getsenv",
    ],
    [
        "getthreadidentity",
        "Reflection",
        "getthreadidentity retrieves the running Luau thread's identity.",
        "function getthreadidentity(): number",
        "https://docs.sunc.su/Reflection/getthreadidentity",
    ],
    [
        "hookfunction",
        "Closures",
        "hookfunction allows you to hook a function with another wanted function, returning the original unhooked function.",
        "function hookfunction<A1..., R1..., A2..., R2...>(functionToHook: (A1...) -> R1..., hook: (A2...) -> R2...): (A1...) -> R1...",
        "https://docs.sunc.su/Closures/hookfunction",
    ],
    [
        "hookmetamethod",
        "Closures",
        "hookmetamethod takes any Luau object that can have a metatable, and attempts to hook the specified metamethod of the object.",
        "function hookmetamethod(object: { [any]: any } | Instance | userdata, metamethodName: string, hook: (...any) -> (...any)): (...any) -> (...any)",
        "https://docs.sunc.su/Closures/hookmetamethod",
    ],
    [
        "identifyexecutor",
        "Miscellaneous",
        "identifyexecutor returns the name and version of the currently running executor.",
        "function identifyexecutor(): (string, string)",
        "https://docs.sunc.su/Miscellaneous/identifyexecutor",
    ],
    [
        "iscclosure",
        "Closures",
        "iscclosure checks whether a given function is a C closure or not.",
        "function iscclosure(func: (...any) -> (...any)): boolean",
        "https://docs.sunc.su/Closures/iscclosure",
    ],
    [
        "isexecutorclosure",
        "Closures",
        "isexecutorclosure checks whether a given function is a closure of the executor.",
        "function isexecutorclosure(func: (...any) -> (...any)): boolean",
        "https://docs.sunc.su/Closures/isexecutorclosure",
    ],
    [
        "isfile",
        "Filesystem",
        "isfile checks whether a given path exists and refers to a file.",
        "function isfile(path: string): boolean",
        "https://docs.sunc.su/Filesystem/isfile",
    ],
    [
        "isfolder",
        "Filesystem",
        "isfolder checks whether a given path exists and refers to a folder.",
        "function isfolder(path: string): boolean",
        "https://docs.sunc.su/Filesystem/isfolder",
    ],
    [
        "islclosure",
        "Closures",
        "islclosure checks whether a given function is a Luau closure or not.",
        "function islclosure(func: (...any) -> (...any)): boolean",
        "https://docs.sunc.su/Closures/islclosure",
    ],
    [
        "isreadonly",
        "Metatable",
        "isreadonly checks whether a table is currently set as readonly.",
        "function isreadonly(table: { any }): boolean",
        "https://docs.sunc.su/Metatable/isreadonly",
    ],
    [
        "isrenderobj",
        "Drawing",
        "isrenderobj checks whether a given value is a valid Drawing object.",
        "function isrenderobj(object: any): boolean",
        "https://docs.sunc.su/Drawing/isrenderobj",
    ],
    [
        "isscriptable",
        "Reflection",
        "isscriptable returns whether the given property of an Instance is scriptable.",
        "function isscriptable(object: Instance, property: string): boolean | nil",
        "https://docs.sunc.su/Reflection/isscriptable",
    ],
    [
        "listfiles",
        "Filesystem",
        "listfiles returns an array of strings representing all files and folders within the specified directory.",
        "function listfiles(path: string): { string }",
        "https://docs.sunc.su/Filesystem/listfiles",
    ],
    [
        "loadfile",
        "Filesystem",
        "loadfile compiles the Luau source code from a file and returns the resulting function chunk.",
        "function loadfile<A...>(path: string): ((A...) -> any | nil, string?)",
        "https://docs.sunc.su/Filesystem/loadfile",
    ],
    [
        "loadstring",
        "Closures",
        "loadstring compiles a string of Luau code and returns it as a runnable function.",
        "function loadstring<A...>(source: string, chunkname: string?): (((A...) -> any) | nil, string?)",
        "https://docs.sunc.su/Closures/loadstring",
    ],
    [
        "lz4compress",
        "Encoding",
        "lz4compress compresses a string with the LZ4 compression algorithm.",
        "function lz4compress(data: string): string",
        "https://docs.sunc.su/Encoding/lz4compress",
    ],
    [
        "lz4decompress",
        "Encoding",
        "lz4decompress decompresses a string encoded with the LZ4 compression algorithm back to regular data.",
        "function lz4decompress(data: string): string",
        "https://docs.sunc.su/Encoding/lz4decompress",
    ],
    [
        "makefolder",
        "Filesystem",
        "makefolder creates a folder at the specified path if one does not already exist.",
        "function makefolder(path: string): ()",
        "https://docs.sunc.su/Filesystem/makefolder",
    ],
    [
        "newcclosure",
        "Closures",
        "newcclosure takes any Luau function and wraps it into a C closure.",
        "function newcclosure<A..., R...>(functionToWrap: (A...) -> R...): (A...) -> R...",
        "https://docs.sunc.su/Closures/newcclosure",
    ],
    [
        "readfile",
        "Filesystem",
        "readfile retrieves the contents of a file at the specified path and returns it as a string.",
        "function readfile(path: string): string",
        "https://docs.sunc.su/Filesystem/readfile",
    ],
    [
        "replicatesignal",
        "Signals",
        "replicatesignal replicates a signal to the server with the provided arguments, if possible.",
        "function replicatesignal(signal: RBXScriptSignal, ...: any?)",
        "https://docs.sunc.su/Signals/replicatesignal",
    ],
    [
        "request",
        "Miscellaneous",
        "request sends a HTTP request to the given URL using the provided configuration table.",
        "function request(options: RequestOptions): Response",
        "https://docs.sunc.su/Miscellaneous/request",
    ],
    [
        "restorefunction",
        "Closures",
        "restorefunction restores a hooked function back to the very first original function, even if it has been hooked multiple times.",
        "function restorefunction(functionToRestore: (...any) -> (...any)): ()",
        "https://docs.sunc.su/Closures/restorefunction",
    ],
    [
        "sethiddenproperty",
        "Reflection",
        "sethiddenproperty assigns a value to a hidden or non-scriptable property of an Instance.",
        "function sethiddenproperty(instance: Instance, property_name: string, property_value: any): boolean",
        "https://docs.sunc.su/Reflection/sethiddenproperty",
    ],
    [
        "setrawmetatable",
        "Metatable",
        "setrawmetatable forcibly sets the metatable of a value, bypassing the __metatable protection field.",
        "function setrawmetatable<T>(object: T & ({ any } | userdata), metatable: { any }): T",
        "https://docs.sunc.su/Metatable/setrawmetatable",
    ],
    [
        "setreadonly",
        "Metatable",
        "setreadonly sets whether a table is readonly or writable.",
        "function setreadonly(table: { any }, state: boolean): ()",
        "https://docs.sunc.su/Metatable/setreadonly",
    ],
    [
        "setrenderproperty",
        "Drawing",
        "setrenderproperty assigns a value to a property of a Drawing object.",
        "function setrenderproperty(drawing: Drawing, property: string, value: any): ()",
        "https://docs.sunc.su/Drawing/setrenderproperty",
    ],
    [
        "setscriptable",
        "Reflection",
        "setscriptable toggles the scriptability of a hidden or non-scriptable property on an Instance.",
        "function setscriptable(instance: Instance, property_name: string, state: boolean): boolean | nil",
        "https://docs.sunc.su/Reflection/setscriptable",
    ],
    [
        "setthreadidentity",
        "Reflection",
        "setthreadidentity sets the current Luau thread identity and capabilities matching that identity.",
        "function setthreadidentity(id: number): ()",
        "https://docs.sunc.su/Reflection/setthreadidentity",
    ],
    [
        "writefile",
        "Filesystem",
        "writefile writes data to a file at the specified path. If the file already exists, its contents will be overwritten.",
        "function writefile(path: string, data: string): ()",
        "https://docs.sunc.su/Filesystem/writefile",
    ],
] as const;

const SUNC_DEBUG_DATA = [
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
] as const;

export const SUNC_GLOBAL_FUNCTION_NAMES = SUNC_GLOBAL_DATA.map(
    ([name]) => name,
);

export const SUNC_NAMESPACE_NAMES = ["debug"] as const;

export const SUNC_NAMESPACE_FUNCTION_NAMES = SUNC_DEBUG_DATA.map(
    ([memberName]) => memberName,
);

export const SUNC_TOP_LEVEL_COMPLETIONS: LuauCompletionItem[] = [
    createItem(
        "debug",
        "sunc Debug",
        "sUNC debug inspection and mutation helpers.",
        "namespace debug",
        "https://docs.sunc.su/Debug",
        {
            kind: "namespace",
            score: 1180,
        },
    ),
    ...SUNC_GLOBAL_DATA.map(([name, category, summary, signature, link]) =>
        createItem(name, `sunc ${category}`, summary, signature, link, {
            kind: "function",
            score: 1170,
        }),
    ),
];

export const SUNC_NAMESPACE_COMPLETIONS: LuauNamespaceCompletionGroup[] = [
    createNamespaceGroup(
        "debug",
        SUNC_DEBUG_DATA.map(([memberName, summary, signature, link]) =>
            createItem(memberName, "sunc Debug", summary, signature, link, {
                kind: "function",
                namespace: "debug",
                score: 1170,
            }),
        ),
    ),
];
