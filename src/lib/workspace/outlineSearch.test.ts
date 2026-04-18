import { describe, expect, it } from "vite-plus/test";
import type { LuauFileSymbol } from "../luau/luau.type";
import {
    getWorkspaceOutlineGroups,
    searchWorkspaceOutlineGroups,
} from "./outlineSearch";

function createSymbol(
    overrides: Partial<LuauFileSymbol> & Pick<LuauFileSymbol, "label">,
): LuauFileSymbol {
    const { label, ...restOverrides } = overrides;

    return {
        label,
        kind: "function",
        detail: "",
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
            source: "test",
            summary: "",
        },
        ...restOverrides,
    };
}

describe("getWorkspaceOutlineGroups", () => {
    it("groups symbols into functions, comments, locals, and globals", () => {
        const groups = getWorkspaceOutlineGroups([
            createSymbol({ label: "renderNode", kind: "function" }),
            createSymbol({
                label: "Utilities",
                kind: "comment",
                detail: "comment",
            }),
            createSymbol({
                label: "localState",
                kind: "constant",
                isLexical: true,
            }),
            createSymbol({
                label: "HttpService",
                kind: "service",
            }),
        ]);

        expect(
            groups.map((group) => ({
                title: group.title,
                labels: group.symbols.map((symbol) => symbol.label),
            })),
        ).toEqual([
            { title: "Functions", labels: ["renderNode"] },
            { title: "Comments", labels: ["Utilities"] },
            { title: "Locals", labels: ["localState"] },
            { title: "Globals", labels: ["HttpService"] },
        ]);
    });
});

describe("searchWorkspaceOutlineGroups", () => {
    const symbols = [
        createSymbol({ label: "render_node", kind: "function" }),
        createSymbol({
            label: "stateValue",
            kind: "constant",
            detail: "Local cache",
            isLexical: true,
        }),
        createSymbol({
            label: "Networking",
            kind: "comment",
            detail: "comment",
        }),
        createSymbol({
            label: "HttpService",
            kind: "service",
        }),
    ];

    it("normalizes separators and ranks matches with the shared advanced search", () => {
        const groups = searchWorkspaceOutlineGroups(symbols, "render node");

        expect(groups).toHaveLength(1);
        expect(groups[0]?.title).toBe("Functions");
        expect(groups[0]?.symbols.map((symbol) => symbol.label)).toEqual([
            "render_node",
        ]);
    });

    it("matches detail text and group names", () => {
        const detailGroups = searchWorkspaceOutlineGroups(symbols, "cache");
        const commentGroups = searchWorkspaceOutlineGroups(symbols, "comments");
        const groupGroups = searchWorkspaceOutlineGroups(symbols, "globals");

        expect(detailGroups[0]?.symbols.map((symbol) => symbol.label)).toEqual([
            "stateValue",
        ]);
        expect(commentGroups[0]?.symbols.map((symbol) => symbol.label)).toEqual(
            ["Networking"],
        );
        expect(groupGroups[0]?.symbols.map((symbol) => symbol.label)).toEqual([
            "HttpService",
        ]);
    });

    it("supports fuzzy subsequence matching", () => {
        const groups = searchWorkspaceOutlineGroups(symbols, "hs");

        expect(groups[0]?.symbols.map((symbol) => symbol.label)).toEqual([
            "HttpService",
        ]);
    });
});
