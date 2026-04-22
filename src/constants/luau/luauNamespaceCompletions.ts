import type { LuauNamespaceCompletionGroup } from "../../lib/luau/luau.type";
import { LUAU_BIT32_NAMESPACE_COMPLETION } from "./luauBit32NamespaceCompletion";
import { LUAU_BUFFER_NAMESPACE_COMPLETION } from "./luauBufferNamespaceCompletion";
import { LUAU_COROUTINE_NAMESPACE_COMPLETION } from "./luauCoroutineNamespaceCompletion";
import { LUAU_MATH_NAMESPACE_COMPLETION } from "./luauMathNamespaceCompletion";
import { LUAU_STRING_NAMESPACE_COMPLETION } from "./luauStringNamespaceCompletion";
import { LUAU_TABLE_NAMESPACE_COMPLETION } from "./luauTableNamespaceCompletion";
import { LUAU_UTF8_NAMESPACE_COMPLETION } from "./luauUtf8NamespaceCompletion";

export const LUAU_NAMESPACE_COMPLETIONS: LuauNamespaceCompletionGroup[] = [
    LUAU_MATH_NAMESPACE_COMPLETION,
    LUAU_STRING_NAMESPACE_COMPLETION,
    LUAU_TABLE_NAMESPACE_COMPLETION,
    LUAU_COROUTINE_NAMESPACE_COMPLETION,
    LUAU_UTF8_NAMESPACE_COMPLETION,
    LUAU_BIT32_NAMESPACE_COMPLETION,
    LUAU_BUFFER_NAMESPACE_COMPLETION,
];
