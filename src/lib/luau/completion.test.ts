import { describe, expect, it } from "vite-plus/test";
import { getLuauCompletionQuery, shouldOpenLuauCompletion } from "./completion";
import type { LuauCompletionQuery } from "./completion.type";

function getCompletionQuery(content: string): LuauCompletionQuery {
    return getLuauCompletionQuery({
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
});
