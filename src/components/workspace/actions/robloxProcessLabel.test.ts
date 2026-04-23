import { describe, expect, it } from "vite-plus/test";
import { getLiveRobloxAccountTooltipLabel } from "./robloxProcessLabel";

describe("robloxProcessLabel", () => {
    it("formats the live launch tooltip label", () => {
        expect(
            getLiveRobloxAccountTooltipLabel({
                userId: 42,
                username: "cool-user",
                displayName: "Cool User",
                avatarUrl: null,
            }),
        ).toBe("Cool User (@cool-user)");
    });
});
