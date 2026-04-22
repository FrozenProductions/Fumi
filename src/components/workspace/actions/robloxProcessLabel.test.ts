import { describe, expect, it } from "vite-plus/test";
import {
    getLiveRobloxAccountTooltipLabel,
    getRobloxProcessAccountLabel,
} from "./robloxProcessLabel";

describe("robloxProcessLabel", () => {
    it("prefers the bound account display name", () => {
        expect(
            getRobloxProcessAccountLabel({
                boundAccountDisplayName: "Cool User",
                isBoundToUnknownAccount: false,
            }),
        ).toBe("Cool User");
    });

    it("masks real bound account labels when requested", () => {
        expect(
            getRobloxProcessAccountLabel(
                {
                    boundAccountDisplayName: "Cool User",
                    isBoundToUnknownAccount: false,
                },
                { isMasked: true },
            ),
        ).toBe("Hidden account");
    });

    it("marks unknown running instances clearly", () => {
        expect(
            getRobloxProcessAccountLabel({
                boundAccountDisplayName: null,
                isBoundToUnknownAccount: true,
            }),
        ).toBe("Unknown account");
    });

    it("keeps unknown running instances visible while masked", () => {
        expect(
            getRobloxProcessAccountLabel(
                {
                    boundAccountDisplayName: null,
                    isBoundToUnknownAccount: true,
                },
                { isMasked: true },
            ),
        ).toBe("Unknown account");
    });

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
