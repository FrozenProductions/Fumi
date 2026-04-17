import { describe, expect, it } from "vite-plus/test";
import { getExecutorPortLabel } from "./executorPortLabel";

describe("getExecutorPortLabel", () => {
    it("prefers the bound account display name", () => {
        expect(
            getExecutorPortLabel({
                port: 5553,
                boundAccountId: "account-1",
                boundAccountDisplayName: "Alpha",
                isBoundToUnknownAccount: false,
            }),
        ).toBe("Alpha");
    });

    it("marks unknown bound ports clearly", () => {
        expect(
            getExecutorPortLabel({
                port: 5554,
                boundAccountId: null,
                boundAccountDisplayName: null,
                isBoundToUnknownAccount: true,
            }),
        ).toBe("Unknown account");
    });

    it("labels free ports as available", () => {
        expect(
            getExecutorPortLabel({
                port: 5555,
                boundAccountId: null,
                boundAccountDisplayName: null,
                isBoundToUnknownAccount: false,
            }),
        ).toBe("Available");
    });
});
