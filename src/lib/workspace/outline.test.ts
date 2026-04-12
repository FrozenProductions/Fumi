import { describe, expect, it } from "vite-plus/test";
import type { LuauFileSymbol } from "../luau/luau.type";
import type { LuauFileAnalysis } from "../luau/symbolScanner.type";
import {
    getWorkspaceLineNumberFromOffset,
    getWorkspaceOutlineCacheHit,
    incrementallyUpdateWorkspaceOutline,
    storeWorkspaceOutlineCacheEntry,
} from "./outline";

function createSymbol(label: string): LuauFileSymbol {
    return {
        label,
        kind: "function",
        detail: "()",
        declarationStart: 0,
        declarationEnd: 0,
        isLexical: false,
        ownerFunctionEnd: null,
        ownerFunctionStart: null,
        scopeStart: 0,
        scopeEnd: 0,
        visibleStart: 0,
        visibleEnd: 0,
        doc: {
            summary: "",
            source: "test",
        },
    };
}

describe("workspace outline cache", () => {
    it("returns cached symbols only for an exact tab/file/hash match", () => {
        const cache = new Map();
        const entry = {
            analysis: {
                functionScopes: [],
                symbols: [createSymbol("main")],
            },
            contentHash: "deadbeef",
            contentLength: "local function main() end".length,
            fileName: "main.luau",
        };

        storeWorkspaceOutlineCacheEntry(cache, "tab-1", entry);

        expect(
            getWorkspaceOutlineCacheHit(
                cache,
                "tab-1",
                "main.luau",
                "deadbeef",
                "local function main() end".length,
            ),
        ).toEqual(entry);
        expect(
            getWorkspaceOutlineCacheHit(
                cache,
                "tab-1",
                "other.luau",
                "deadbeef",
                "local function main() end".length,
            ),
        ).toBeNull();
        expect(
            getWorkspaceOutlineCacheHit(
                cache,
                "tab-1",
                "main.luau",
                "cafebabe",
                "local function main() end".length,
            ),
        ).toBeNull();
    });

    it("evicts the oldest cached tab when the cache exceeds the max size", () => {
        const cache = new Map();

        storeWorkspaceOutlineCacheEntry(cache, "tab-1", {
            analysis: {
                functionScopes: [],
                symbols: [createSymbol("one")],
            },
            contentHash: "1",
            contentLength: 3,
            fileName: "one.luau",
        });
        storeWorkspaceOutlineCacheEntry(cache, "tab-2", {
            analysis: {
                functionScopes: [],
                symbols: [createSymbol("two")],
            },
            contentHash: "2",
            contentLength: 3,
            fileName: "two.luau",
        });
        storeWorkspaceOutlineCacheEntry(
            cache,
            "tab-3",
            {
                analysis: {
                    functionScopes: [],
                    symbols: [createSymbol("three")],
                },
                contentHash: "3",
                contentLength: 5,
                fileName: "three.luau",
            },
            2,
        );

        expect(cache.has("tab-1")).toBe(false);
        expect(cache.has("tab-2")).toBe(true);
        expect(cache.has("tab-3")).toBe(true);
    });
});

describe("workspace outline incremental updates", () => {
    it("shifts cached symbol offsets for non-structural edits", () => {
        const previousContent = "print('a')\nlocal foo = 1\n";
        const nextContent = "print('ab')\nlocal foo = 1\n";
        const previousAnalysis: LuauFileAnalysis = {
            functionScopes: [],
            symbols: [
                {
                    ...createSymbol("foo"),
                    declarationStart: 17,
                    declarationEnd: 20,
                    scopeStart: 0,
                    scopeEnd: previousContent.length,
                    visibleStart: 20,
                    visibleEnd: previousContent.length,
                },
            ],
        };

        const nextAnalysis = incrementallyUpdateWorkspaceOutline({
            change: {
                action: "insert",
                end: {
                    row: 0,
                    column: 8,
                },
                lines: ["b"],
                start: {
                    row: 0,
                    column: 8,
                },
            },
            nextContent,
            previousAnalysis,
            previousContent,
        });

        expect(nextAnalysis?.symbols[0]?.declarationStart).toBe(18);
        expect(nextAnalysis?.symbols[0]?.declarationEnd).toBe(21);
    });

    it("falls back when an edit touches structural syntax", () => {
        const previousContent = "local foo = 1\n";
        const nextContent = "local function foo() end\n";
        const previousAnalysis: LuauFileAnalysis = {
            functionScopes: [],
            symbols: [createSymbol("foo")],
        };

        const nextAnalysis = incrementallyUpdateWorkspaceOutline({
            change: {
                action: "insert",
                end: {
                    row: 0,
                    column: 6,
                },
                lines: ["function "],
                start: {
                    row: 0,
                    column: 6,
                },
            },
            nextContent,
            previousAnalysis,
            previousContent,
        });

        expect(nextAnalysis).toBeNull();
    });
});

describe("getWorkspaceLineNumberFromOffset", () => {
    it("maps a declaration offset to a 1-based editor line", () => {
        const content = [
            "local one = 1",
            "local two = 2",
            "local function target()",
            "end",
        ].join("\n");

        expect(
            getWorkspaceLineNumberFromOffset(
                content,
                content.indexOf("target"),
            ),
        ).toBe(3);
    });

    it("clamps invalid or oversized offsets to a valid line number", () => {
        const content = "first\nsecond\nthird";

        expect(getWorkspaceLineNumberFromOffset(content, -1)).toBe(1);
        expect(
            getWorkspaceLineNumberFromOffset(content, content.length + 100),
        ).toBe(3);
    });
});
