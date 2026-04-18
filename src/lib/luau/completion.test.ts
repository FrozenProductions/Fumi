import { describe, expect, it } from "vite-plus/test";
import { EMPTY_LUAU_FILE_ANALYSIS } from "../../constants/luau/luau";
import { getLuauCompletionQuery, shouldOpenLuauCompletion } from "./completion";
import type { LuauCompletionQuery } from "./completion.type";

function getCompletionQuery(
    content: string,
    analysis = EMPTY_LUAU_FILE_ANALYSIS,
): LuauCompletionQuery {
    return getLuauCompletionQuery({
        analysis,
        column: content.length,
        content,
        priority: "balanced",
        row: 0,
    });
}

describe("shouldOpenLuauCompletion", () => {
    it("closes passive completion for an exact-only match", () => {
        const query: LuauCompletionQuery = {
            items: [
                {
                    label: "appendfile",
                    kind: "function",
                    detail: "Filesystem",
                    doc: {
                        summary: "Append string content to the end of a file.",
                        source: "test",
                    },
                    sourceGroup: "executor",
                },
            ],
            namespacePath: null,
            prefix: "appendfile",
            replaceStartColumn: 0,
            replaceEndColumn: "appendfile".length,
        };

        expect(shouldOpenLuauCompletion(query)).toBe(false);
    });

    it("keeps passive completion open when an exact root match still has longer continuations", () => {
        const query = getCompletionQuery("http");

        expect(query.items.map((item) => item.label)).toEqual(
            expect.arrayContaining(["http", "http_request"]),
        );
        expect(shouldOpenLuauCompletion(query)).toBe(true);
    });

    it("keeps passive completion open when an exact namespaced match still has longer continuations", () => {
        const query = getCompletionQuery("debug.getproto");

        expect(query.items.map((item) => item.label)).toEqual(
            expect.arrayContaining(["getproto", "getprotos"]),
        );
        expect(shouldOpenLuauCompletion(query)).toBe(true);
    });

    it("closes when there are no matches", () => {
        const query = getCompletionQuery("zzzzzzzzzz");

        expect(query.items).toHaveLength(0);
        expect(shouldOpenLuauCompletion(query)).toBe(false);
    });

    it("keeps manual completion open when matches exist, even for an exact-only match", () => {
        const query: LuauCompletionQuery = {
            items: [
                {
                    label: "appendfile",
                    kind: "function",
                    detail: "Filesystem",
                    doc: {
                        summary: "Append string content to the end of a file.",
                        source: "test",
                    },
                    sourceGroup: "executor",
                },
            ],
            namespacePath: null,
            prefix: "appendfile",
            replaceStartColumn: 0,
            replaceEndColumn: "appendfile".length,
        };

        expect(shouldOpenLuauCompletion(query, true)).toBe(true);
    });

    it("includes visible file symbols from precomputed analysis", () => {
        const query = getCompletionQuery("fo", {
            functionScopes: [],
            symbols: [
                {
                    label: "foo",
                    kind: "constant",
                    detail: "local variable",
                    declarationStart: 0,
                    declarationEnd: 3,
                    isLexical: true,
                    ownerFunctionStart: null,
                    ownerFunctionEnd: null,
                    scopeStart: 0,
                    scopeEnd: 2,
                    visibleStart: 0,
                    visibleEnd: 2,
                    doc: {
                        summary: "Local variable declared in the current file.",
                        source: "Current File",
                    },
                    score: 2000,
                },
            ],
        });

        expect(query.items.map((item) => item.label)).toContain("foo");
    });
});
