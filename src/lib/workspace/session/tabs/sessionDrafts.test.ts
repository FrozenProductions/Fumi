import { describe, expect, it } from "vite-plus/test";
import { createSnapshotTab, createWorkspaceSession } from "../sessionTestUtils";
import { hasWorkspaceDraftChanges } from "./sessionTabs";

describe("hasWorkspaceDraftChanges", () => {
    it("returns true only when a tab content differs from saved content", () => {
        expect(hasWorkspaceDraftChanges(createWorkspaceSession())).toBe(false);
        expect(
            hasWorkspaceDraftChanges(
                createWorkspaceSession({
                    tabs: [
                        {
                            ...createSnapshotTab("tab-1", {
                                content: "dirty",
                            }),
                            savedContent: "saved",
                        },
                    ],
                }),
            ),
        ).toBe(true);
    });
});
