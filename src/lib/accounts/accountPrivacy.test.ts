import { describe, expect, it } from "vite-plus/test";
import {
    MASKED_ACCOUNT_IDENTITY_LABEL,
    MASKED_ACCOUNT_LABEL,
} from "../../constants/accounts/accounts";
import {
    getAccountAvatarAltText,
    getAccountRowDisplayName,
    getAccountRowIdentityLabel,
    getExecutorBoundAccountLabel,
    getRobloxProcessBoundAccountLabel,
} from "./accountPrivacy";

describe("accountPrivacy", () => {
    it("masks real bound account labels", () => {
        expect(
            getExecutorBoundAccountLabel(
                {
                    boundAccountDisplayName: "Alpha",
                    isBoundToUnknownAccount: false,
                },
                { isMasked: true },
            ),
        ).toBe(MASKED_ACCOUNT_LABEL);
    });

    it("keeps unknown account labels visible while masked", () => {
        expect(
            getExecutorBoundAccountLabel(
                {
                    boundAccountDisplayName: null,
                    isBoundToUnknownAccount: true,
                },
                { isMasked: true },
            ),
        ).toBe("Unknown account");
    });

    it("keeps available port labels visible while masked", () => {
        expect(
            getExecutorBoundAccountLabel(
                {
                    boundAccountDisplayName: null,
                    isBoundToUnknownAccount: false,
                },
                { isMasked: true },
            ),
        ).toBe("Available");
    });

    it("masks account row identity text", () => {
        expect(
            getAccountRowDisplayName(
                {
                    displayName: "Alpha",
                    username: "alpha-user",
                },
                { isMasked: true },
            ),
        ).toBe(MASKED_ACCOUNT_LABEL);
        expect(
            getAccountRowIdentityLabel(
                {
                    displayName: "Alpha",
                    username: "alpha-user",
                },
                { isMasked: true },
            ),
        ).toBe(MASKED_ACCOUNT_IDENTITY_LABEL);
    });

    it("uses generic avatar alt text while masked", () => {
        expect(
            getAccountAvatarAltText(
                {
                    displayName: "Alpha",
                },
                { isMasked: true },
            ),
        ).toBe("Account avatar");
    });

    it("keeps unknown process rows visible while masked", () => {
        expect(
            getRobloxProcessBoundAccountLabel(
                {
                    boundAccountDisplayName: null,
                    isBoundToUnknownAccount: true,
                },
                { isMasked: true },
            ),
        ).toBe("Unknown account");
    });
});
