import { describe, expect, it } from "vite-plus/test";
import {
    getExecutorPortRangeErrorMessage,
    normalizeExecutorPort,
    parseExecutorPort,
} from "./executor";

describe("workspace executor helpers", () => {
    it("parses only ports that are available for the active executor", () => {
        expect(parseExecutorPort("5553", [5553, 5554])).toBe(5553);
        expect(parseExecutorPort("8392", [5553, 5554])).toBeNull();
    });

    it("normalizes invalid selections to the first available port", () => {
        expect(normalizeExecutorPort("5553", [8392, 8393, 8394])).toBe("8392");
        expect(normalizeExecutorPort("8394", [8392, 8393, 8394])).toBe("8394");
    });

    it("builds an error message from the backend-provided port list", () => {
        expect(getExecutorPortRangeErrorMessage([8392, 8393, 8394])).toBe(
            "Port must be one of 8392, 8393, 8394.",
        );
    });
});
