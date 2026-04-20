import { describe, expect, it } from "vite-plus/test";
import { analyzeLuauFileInBackground } from "./workerAnalysis";

describe("analyzeLuauFileInBackground", () => {
    it("falls back to local analysis when workers are unavailable", async () => {
        const analysis = await analyzeLuauFileInBackground({
            content: [
                "-- Utilities",
                "local function greet()",
                "    print('hi')",
                "end",
            ].join("\n"),
        });

        expect(
            analysis.symbols.some(
                (symbol) =>
                    symbol.kind === "function" && symbol.label === "greet",
            ),
        ).toBe(true);
    });
});
