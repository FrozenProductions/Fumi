import { describe, expect, it } from "vite-plus/test";
import { scanLuauFileAnalysis } from "./symbolScanner";

describe("scanLuauFileAnalysis", () => {
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
});
