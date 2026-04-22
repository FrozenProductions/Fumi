import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vite-plus/test";
import {
    getWorkspacePersistSignature,
    persistRecentWorkspacePaths,
    readRecentWorkspacePaths,
    updateRecentWorkspacePaths,
} from "./persistence";
import type { WorkspaceSession } from "./workspace.type";

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
        executionHistory: [],
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
            executionHistory: [
                {
                    id: "history-1",
                    executedAt: 1,
                    executorKind: "macsploit",
                    port: 5553,
                    accountId: null,
                    accountDisplayName: null,
                    isBoundToUnknownAccount: false,
                    fileName: "script.lua",
                    scriptContent: "print('hello')",
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

describe("readRecentWorkspacePaths", () => {
    it("returns normalized workspace paths for valid stored values", () => {
        globalThis.localStorage.setItem(
            RECENT_WORKSPACE_STORAGE_KEY,
            JSON.stringify([
                " /workspace/one ",
                "/workspace/two",
                "/workspace/one",
                "",
            ]),
        );

        expect(readRecentWorkspacePaths()).toEqual([
            "/workspace/one",
            "/workspace/two",
        ]);
    });
});

describe("readRecentWorkspacePaths error handling", () => {
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

describe("persistRecentWorkspacePaths", () => {
    it("warns when local storage rejects a write", () => {
        const warnSpy = vi
            .spyOn(console, "warn")
            .mockImplementation(() => undefined);
        const setItem = vi.fn(() => {
            throw new Error("disk full");
        });

        Object.defineProperty(globalThis, "localStorage", {
            configurable: true,
            writable: true,
            value: {
                ...createLocalStorageMock(),
                setItem,
            } satisfies Storage,
        });

        persistRecentWorkspacePaths(["/workspace/one", "/workspace/two"]);

        expect(setItem).toHaveBeenCalledWith(
            RECENT_WORKSPACE_STORAGE_KEY,
            JSON.stringify(["/workspace/one", "/workspace/two"]),
        );
        expect(warnSpy).toHaveBeenCalledOnce();
    });
});
