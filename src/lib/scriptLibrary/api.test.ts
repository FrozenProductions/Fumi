import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { DEFAULT_SCRIPT_LIBRARY_FILTERS } from "../../constants/scriptLibrary/scriptLibrary";
import {
    createScriptLibraryCachedSession,
    fetchFilteredScriptsPage,
} from "./api";

function createRscriptsEntry(id: string) {
    return {
        _id: id,
        title: `Script ${id}`,
        description: `Description ${id}`,
        createdAt: "2026-01-02T00:00:00.000Z",
        views: 1,
        likes: 1,
        slug: `script-${id}`,
        rawScript: null,
        paid: false,
        keySystem: false,
        mobileReady: true,
        unpatched: true,
        creator: "dayte",
        user: {
            _id: `user-${id}`,
            username: "dayte",
            image: null,
            verified: true,
        },
    };
}

function createRscriptsPage(page: number, maxPages: number) {
    const firstId = (page - 1) * 20;

    return {
        scripts: Array.from({ length: 20 }, (_, index) =>
            createRscriptsEntry(String(firstId + index + 1)),
        ),
        info: {
            currentPage: page,
            maxPages,
        },
    };
}

describe("fetchFilteredScriptsPage", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("continues filtered pagination from the previous source page", async () => {
        const requestedPages: number[] = [];
        const fetchMock = vi.fn(async (url: string | URL | Request) => {
            const parsedUrl = new URL(String(url));
            const page = Number(parsedUrl.searchParams.get("page") ?? "1");

            requestedPages.push(page);

            return new Response(JSON.stringify(createRscriptsPage(page, 3)));
        });
        const session = createScriptLibraryCachedSession();
        const filters = {
            ...DEFAULT_SCRIPT_LIBRARY_FILTERS,
            keyless: true,
        };

        vi.stubGlobal("fetch", fetchMock);

        const firstPage = await fetchFilteredScriptsPage(
            session,
            "",
            1,
            filters,
            "date",
            new AbortController().signal,
        );
        const secondPage = await fetchFilteredScriptsPage(
            session,
            "",
            2,
            filters,
            "date",
            new AbortController().signal,
        );

        expect(requestedPages).toEqual([1, 2]);
        expect(firstPage.scripts.map((script) => script._id)).toEqual(
            Array.from({ length: 16 }, (_, index) => String(index + 1)),
        );
        expect(secondPage.scripts.map((script) => script._id)).toEqual(
            Array.from({ length: 16 }, (_, index) => String(index + 17)),
        );
    });
});
