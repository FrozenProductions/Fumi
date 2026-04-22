import { describe, expect, it } from "vite-plus/test";
import {
    buildWorkspaceEditorSearchOptions,
    canRunWorkspaceEditorSearch,
    createWorkspaceEditorSearchState,
    getWorkspaceEditorSearchValidationError,
} from "./editorSearch";

describe("buildWorkspaceEditorSearchOptions", () => {
    it("builds plain-text search options with wrap enabled", () => {
        expect(
            buildWorkspaceEditorSearchOptions(
                createWorkspaceEditorSearchState({
                    query: "needle",
                }),
            ),
        ).toEqual({
            needle: "needle",
            caseSensitive: false,
            wholeWord: false,
            regExp: false,
            wrap: true,
        });
    });

    it("applies case-sensitive, whole-word, and regex flags", () => {
        expect(
            buildWorkspaceEditorSearchOptions(
                createWorkspaceEditorSearchState({
                    query: "^FindMe$",
                    isCaseSensitive: true,
                    isWholeWord: true,
                    isRegex: true,
                }),
            ),
        ).toEqual({
            needle: "^FindMe$",
            caseSensitive: true,
            wholeWord: true,
            regExp: true,
            wrap: true,
        });
    });
});

describe("getWorkspaceEditorSearchValidationError", () => {
    it("reports invalid regex patterns", () => {
        expect(
            getWorkspaceEditorSearchValidationError("[unterminated", true),
        ).toBe("Invalid regular expression");
    });

    it("accepts valid regex patterns and plain-text queries", () => {
        expect(
            getWorkspaceEditorSearchValidationError("^value+$", true),
        ).toBeNull();
        expect(
            getWorkspaceEditorSearchValidationError("[unterminated", false),
        ).toBeNull();
    });
});

describe("canRunWorkspaceEditorSearch", () => {
    it("requires a non-empty valid query", () => {
        expect(
            canRunWorkspaceEditorSearch(
                createWorkspaceEditorSearchState({
                    query: "",
                }),
            ),
        ).toBe(false);
        expect(
            canRunWorkspaceEditorSearch(
                createWorkspaceEditorSearchState({
                    query: "[unterminated",
                    isRegex: true,
                }),
            ),
        ).toBe(false);
        expect(
            canRunWorkspaceEditorSearch(
                createWorkspaceEditorSearchState({
                    query: "needle",
                }),
            ),
        ).toBe(true);
    });
});
