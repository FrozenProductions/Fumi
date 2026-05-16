import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { DEFAULT_SCRIPT_LIBRARY_FILTERS } from "../../constants/scriptLibrary/scriptLibrary";
import {
    createScriptLibraryCachedSession,
    fetchFilteredScriptsPage,
    fetchScriptsPage,
} from "./api";

function createRscriptsEntry(
    id: string,
    overrides: Record<string, unknown> = {},
) {
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
        game: {
            title: null,
        },
        ...overrides,
    };
}

function createRscriptsPage(
    page: number,
    maxPages: number,
    scripts = Array.from({ length: 20 }, (_, index) => {
        const firstId = (page - 1) * 20;

        return createRscriptsEntry(String(firstId + index + 1));
    }),
) {
    return {
        scripts,
        info: {
            currentPage: page,
            maxPages,
        },
    };
}

describe("fetchScriptsPage", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("ranks exact website-style search titles ahead of loose newest API matches", async () => {
        const fetchMock = vi.fn(async (url: string | URL | Request) => {
            const parsedUrl = new URL(String(url));
            const page = Number(parsedUrl.searchParams.get("page") ?? "1");

            if (page === 1) {
                return new Response(
                    JSON.stringify(
                        createRscriptsPage(1, 2, [
                            createRscriptsEntry("loose", {
                                title: "Infinite Jump Farm",
                                description: "Yield money quickly.",
                                createdAt: "2026-05-16T00:00:00.000Z",
                            }),
                        ]),
                    ),
                );
            }

            return new Response(
                JSON.stringify(
                    createRscriptsPage(2, 2, [
                        createRscriptsEntry("exact", {
                            title: "Infinite Yield",
                            createdAt: "2026-01-03T00:00:00.000Z",
                            game: {
                                title: "Work at a Pizza Place",
                            },
                        }),
                    ]),
                ),
            );
        });
        const session = createScriptLibraryCachedSession();

        vi.stubGlobal("fetch", fetchMock);

        const page = await fetchScriptsPage(
            session,
            "infinite yield",
            1,
            "date",
            new AbortController().signal,
        );

        expect(page.scripts.map((script) => script._id)).toEqual([
            "exact",
            "loose",
        ]);
        expect(page.scripts[0]?.gameTitle).toBe("Work at a Pizza Place");
    });
});

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
        const nextPageNumber = firstPage.canGoNext ? 2 : 1;
        const secondPage = await fetchFilteredScriptsPage(
            session,
            "",
            nextPageNumber,
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
