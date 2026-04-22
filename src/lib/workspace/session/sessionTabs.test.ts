import { describe, expect, it } from "vite-plus/test";
import { getNextActiveTabId } from "./session";
import { createWorkspaceSession } from "./sessionTestUtils";

describe("getNextActiveTabId", () => {
    it("selects the next tab when one exists and otherwise falls back to the previous tab", () => {
        const tabs = createWorkspaceSession().tabs;

        expect(getNextActiveTabId([tabs[1]], 0)).toBe("tab-2");
        expect(getNextActiveTabId([tabs[0]], 1)).toBe("tab-1");
        expect(getNextActiveTabId([], 0)).toBeNull();
    });
});
