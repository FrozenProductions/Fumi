import { describe, expect, it } from "vite-plus/test";
import { scanLuauFileAnalysis } from "./symbolScanner";

describe("scanLuauFileAnalysis", () => {
    it("extracts global environment assignments and functions", () => {
        const analysis = scanLuauFileAnalysis(
            [
                "_G.SharedValue = 1",
                "function _G.SharedFunction()",
                "    return _G.SharedValue",
                "end",
            ].join("\n"),
        );

        expect(
            analysis.symbols
                .filter((symbol) => symbol.namespace === "_G")
                .map((symbol) => ({
                    detail: symbol.detail,
                    kind: symbol.kind,
                    label: symbol.label,
                    namespace: symbol.namespace,
                })),
        ).toEqual([
            {
                detail: "global variable",
                kind: "constant",
                label: "SharedValue",
                namespace: "_G",
            },
            {
                detail: "global function",
                kind: "function",
                label: "SharedFunction",
                namespace: "_G",
            },
        ]);
    });

    it("extracts standalone comments for the outline", () => {
        const analysis = scanLuauFileAnalysis(
            [
                "-- Utilities",
                "local function greet()",
                "    print('hi') -- inline comment should stay out",
                "end",
                "--[[",
                "Networking",
                "helpers",
                "]]",
            ].join("\n"),
        );

        expect(
            analysis.symbols
                .filter((symbol) => symbol.kind === "comment")
                .map((symbol) => ({
                    detail: symbol.detail,
                    label: symbol.label,
                })),
        ).toEqual([
            {
                detail: "comment",
                label: "Utilities",
            },
            {
                detail: "multiline comment",
                label: "Networking",
            },
        ]);
    });

    it("extracts loadstring calls for the outline", () => {
        const analysis = scanLuauFileAnalysis(
            [
                "local run = loadstring(source)",
                "if loadstring(otherSource) then",
                "    print('ready')",
                "end",
                "local text = 'loadstring(hidden)'",
            ].join("\n"),
        );

        expect(
            analysis.symbols
                .filter((symbol) => symbol.kind === "loadstring")
                .map((symbol) => ({
                    detail: symbol.detail,
                    label: symbol.label,
                })),
        ).toEqual([
            {
                detail: "loadstring call",
                label: "loadstring",
            },
            {
                detail: "loadstring call",
                label: "loadstring",
            },
        ]);
    });
});
