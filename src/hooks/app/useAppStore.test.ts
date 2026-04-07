import { beforeEach, describe, expect, it } from "vite-plus/test";
import { useAppStore } from "./useAppStore";

describe("useAppStore renameCurrentTabRequest", () => {
    beforeEach(() => {
        useAppStore.setState({
            renameCurrentTabRequest: null,
            nextRenameCurrentTabRequestId: 0,
        });
    });

    it("increments request ids and clears the request", () => {
        useAppStore.getState().requestRenameCurrentTab();

        expect(useAppStore.getState().renameCurrentTabRequest).toEqual({
            requestId: 1,
        });

        useAppStore.getState().requestRenameCurrentTab();

        expect(useAppStore.getState().renameCurrentTabRequest).toEqual({
            requestId: 2,
        });

        useAppStore.getState().clearRenameCurrentTabRequest();

        expect(useAppStore.getState().renameCurrentTabRequest).toBeNull();
    });
});
