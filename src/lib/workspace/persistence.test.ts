import { Effect } from "effect";
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vite-plus/test";
import type { WorkspaceSession } from "../../lib/workspace/workspace.type";
import {
    getWorkspacePersistSignature,
    persistRecentWorkspacePathsEffect,
    readRecentWorkspacePaths,
    readRecentWorkspacePathsEffect,
    updateRecentWorkspacePaths,
} from "./persistence";

const RECENT_WORKSPACE_STORAGE_KEY = "fumi-recent-workspaces";

type StorageState = Map<string, string>;

function createWorkspaceSession(
    overrides: Partial<WorkspaceSession> = {},
): WorkspaceSession {
    return {
        workspacePath: "/tmp/fumi",
        workspaceName: "fumi",
        activeTabId: "tab-1",
        splitView: null,
        tabs: [
            {
                id: "tab-1",
                fileName: "script.lua",
                content: "print('hello')",
                savedContent: "print('hello')",
                isDirty: false,
                cursor: {
                    line: 0,
                    column: 0,
                    scrollTop: 0,
                },
            },
        ],
        archivedTabs: [],
        ...overrides,
    };
}

function createLocalStorageMock(
    initialEntries?: Record<string, string>,
): Storage {
    const store: StorageState = new Map(Object.entries(initialEntries ?? {}));

    return {
        get length() {
            return store.size;
        },
        clear(): void {
            store.clear();
        },
        getItem(key: string): string | null {
            return store.get(key) ?? null;
        },
        key(index: number): string | null {
            return Array.from(store.keys())[index] ?? null;
        },
        removeItem(key: string): void {
            store.delete(key);
        },
        setItem(key: string, value: string): void {
            store.set(key, value);
        },
    };
}

const originalLocalStorage = globalThis.localStorage;

beforeEach(() => {
    Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        writable: true,
        value: createLocalStorageMock(),
    });
});

afterEach(() => {
    Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        writable: true,
        value: originalLocalStorage,
    });
    vi.restoreAllMocks();
});

describe("updateRecentWorkspacePaths", () => {
    it("trims, deduplicates, prepends the latest path, and caps the result at six items", () => {
        expect(
            updateRecentWorkspacePaths(
                [
                    " /workspace/one ",
                    "/workspace/two",
                    "/workspace/one",
                    "/workspace/three",
                    "/workspace/four",
                    "/workspace/five",
                    "/workspace/six",
                ],
                " /workspace/latest ",
            ),
        ).toEqual([
            "/workspace/latest",
            "/workspace/one",
            "/workspace/two",
            "/workspace/three",
            "/workspace/four",
            "/workspace/five",
        ]);
    });
});

describe("getWorkspacePersistSignature", () => {
    it("is stable for equivalent workspace state and changes when persisted metadata changes", () => {
        const workspace = createWorkspaceSession();
        const equivalentWorkspace = createWorkspaceSession();
        const changedWorkspace = createWorkspaceSession({
            tabs: [
                {
                    ...workspace.tabs[0],
                    cursor: {
                        ...workspace.tabs[0].cursor,
                        column: 3,
                    },
                },
            ],
        });

        expect(getWorkspacePersistSignature(workspace)).toBe(
            getWorkspacePersistSignature(equivalentWorkspace),
        );
        expect(getWorkspacePersistSignature(changedWorkspace)).not.toBe(
            getWorkspacePersistSignature(workspace),
        );
    });
});

describe("readRecentWorkspacePathsEffect", () => {
    it("returns normalized workspace paths for valid stored values", async () => {
        globalThis.localStorage.setItem(
            RECENT_WORKSPACE_STORAGE_KEY,
            JSON.stringify([
                " /workspace/one ",
                "/workspace/two",
                "/workspace/one",
                "",
            ]),
        );

        await expect(
            Effect.runPromise(readRecentWorkspacePathsEffect()),
        ).resolves.toEqual(["/workspace/one", "/workspace/two"]);
    });
});

describe("readRecentWorkspacePaths", () => {
    it("returns an empty list and warns when storage contains malformed json", () => {
        const warnSpy = vi
            .spyOn(console, "warn")
            .mockImplementation(() => undefined);

        globalThis.localStorage.setItem(
            RECENT_WORKSPACE_STORAGE_KEY,
            "{not-json",
        );

        expect(readRecentWorkspacePaths()).toEqual([]);
        expect(warnSpy).toHaveBeenCalledOnce();
    });

    it("returns an empty list and warns when storage contains an invalid schema", () => {
        const warnSpy = vi
            .spyOn(console, "warn")
            .mockImplementation(() => undefined);

        globalThis.localStorage.setItem(
            RECENT_WORKSPACE_STORAGE_KEY,
            JSON.stringify([123, "/workspace/two"]),
        );

        expect(readRecentWorkspacePaths()).toEqual([]);
        expect(warnSpy).toHaveBeenCalledOnce();
    });
});

describe("persistRecentWorkspacePathsEffect", () => {
    it("writes the provided paths to local storage", async () => {
        await Effect.runPromise(
            persistRecentWorkspacePathsEffect([
                "/workspace/one",
                "/workspace/two",
            ]),
        );

        expect(
            globalThis.localStorage.getItem(RECENT_WORKSPACE_STORAGE_KEY),
        ).toBe(JSON.stringify(["/workspace/one", "/workspace/two"]));
    });
});
