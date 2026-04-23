import { describe, expect, it } from "vite-plus/test";
import { EMPTY_LUAU_FILE_ANALYSIS } from "../../../constants/luau/core/luau";
import {
    getLuauCompletionQuery,
    shouldOpenLuauCompletion,
    shouldSuppressLuauCompletionForTokenType,
} from "./completion";
import type { LuauCompletionQuery } from "./completion.type";

function getCompletionQuery(
    content: string,
    analysis = EMPTY_LUAU_FILE_ANALYSIS,
): LuauCompletionQuery {
    return getLuauCompletionQuery({
        analysis,
        beforeCursor: content,
        cursorIndex: content.length,
        priority: "balanced",
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

    it("keeps file symbols visible while typing past stale analysis bounds", () => {
        const previousContent = "local EmbeddedModules = {}\n";
        const query = getLuauCompletionQuery({
            analysis: {
                functionScopes: [],
                symbols: [
                    {
                        label: "EmbeddedModules",
                        kind: "constant",
                        detail: "local variable",
                        declarationStart: 6,
                        declarationEnd: 21,
                        isLexical: true,
                        ownerFunctionStart: null,
                        ownerFunctionEnd: null,
                        scopeStart: 0,
                        scopeEnd: previousContent.length,
                        visibleStart: 22,
                        visibleEnd: previousContent.length,
                        doc: {
                            summary:
                                "Local variable declared in the current file.",
                            source: "Current File",
                        },
                        score: 2000,
                    },
                ],
            },
            beforeCursor: "Emb",
            cursorIndex: previousContent.length + "Emb".length,
            priority: "balanced",
        });

        expect(query.items.map((item) => item.label)).toContain(
            "EmbeddedModules",
        );
    });

    it("excludes outline comments from file completions", () => {
        const query = getCompletionQuery("Ne", {
            functionScopes: [],
            symbols: [
                {
                    label: "Networking",
                    kind: "comment",
                    detail: "comment",
                    declarationStart: 0,
                    declarationEnd: 12,
                    isLexical: false,
                    ownerFunctionStart: null,
                    ownerFunctionEnd: null,
                    scopeStart: 0,
                    scopeEnd: 12,
                    visibleStart: 0,
                    visibleEnd: 12,
                    doc: {
                        summary: "Networking",
                        source: "Current File",
                    },
                    score: 2000,
                },
            ],
        });

        expect(query.items.map((item) => item.label)).not.toContain(
            "Networking",
        );
    });
});

describe("shouldSuppressLuauCompletionForTokenType", () => {
    it("suppresses completion inside string tokens", () => {
        expect(
            shouldSuppressLuauCompletionForTokenType("string.quoted.double"),
        ).toBe(true);
    });

    it("suppresses completion inside comment tokens", () => {
        expect(
            shouldSuppressLuauCompletionForTokenType(
                "comment.line.double-dash",
            ),
        ).toBe(true);
    });

    it("keeps completion enabled for non-string, non-comment tokens", () => {
        expect(shouldSuppressLuauCompletionForTokenType("identifier")).toBe(
            false,
        );
    });
});
