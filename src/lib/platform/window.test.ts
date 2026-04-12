import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vite-plus/test";

const mocks = vi.hoisted(() => {
    const eventHandlers = new Map<
        string,
        (event: { payload?: unknown }) => void
    >();
    let dragDropHandler:
        | ((event: { payload: { type: string; paths?: string[] } }) => void)
        | null = null;

    return {
        get dragDropHandler() {
            return dragDropHandler;
        },
        eventHandlers,
        invoke: vi.fn(),
        isTauriEnvironment: vi.fn(() => true),
        listen: vi.fn(
            async (
                event: string,
                handler: (event: { payload?: unknown }) => void,
            ) => {
                eventHandlers.set(event, handler);
                return vi.fn();
            },
        ),
        window: {
            close: vi.fn().mockResolvedValue(undefined),
            isMaximized: vi.fn().mockResolvedValue(false),
            minimize: vi.fn().mockResolvedValue(undefined),
            onResized: vi.fn(async (listener: () => void) => {
                void listener;
                return vi.fn();
            }),
            startDragging: vi.fn().mockResolvedValue(undefined),
            toggleMaximize: vi.fn().mockResolvedValue(undefined),
            onDragDropEvent: vi.fn(
                async (
                    listener: (event: {
                        payload: { type: string; paths?: string[] };
                    }) => void,
                ) => {
                    dragDropHandler = listener;
                    return vi.fn();
                },
            ),
        },
    };
});

vi.mock("@tauri-apps/api/core", () => ({
    invoke: mocks.invoke,
}));

vi.mock("@tauri-apps/api/event", () => ({
    listen: mocks.listen,
}));

vi.mock("@tauri-apps/api/window", () => ({
    getCurrentWindow: () => mocks.window,
}));

vi.mock("./runtime", () => ({
    isTauriEnvironment: mocks.isTauriEnvironment,
}));

async function loadWindowModule(): Promise<typeof import("./window")> {
    return import("./window");
}

describe("initializeWindowShell", () => {
    beforeEach(() => {
        mocks.eventHandlers.clear();
        mocks.invoke.mockReset();
        mocks.invoke.mockResolvedValue(undefined);
        mocks.isTauriEnvironment.mockReset();
        mocks.isTauriEnvironment.mockReturnValue(true);
        mocks.listen.mockClear();
        mocks.window.close.mockClear();
        mocks.window.isMaximized.mockClear();
        mocks.window.isMaximized.mockResolvedValue(false);
        mocks.window.minimize.mockClear();
        mocks.window.onResized.mockClear();
        mocks.window.onDragDropEvent.mockClear();
        mocks.window.startDragging.mockClear();
        mocks.window.toggleMaximize.mockClear();
    });

    afterEach(() => {
        vi.resetModules();
    });

    it("subscribes once, marks exit preparation, and ignores invalid exit-guard sync payloads", async () => {
        const windowModule = await loadWindowModule();
        const handlePrepareForExit = vi.fn();
        const handleExitGuardSync = vi.fn();

        windowModule.subscribeToPrepareForExit(handlePrepareForExit);
        windowModule.subscribeToExitGuardSyncRequested(handleExitGuardSync);

        await windowModule.initializeWindowShell();
        await windowModule.initializeWindowShell();

        expect(mocks.listen).toHaveBeenCalledTimes(7);
        expect(mocks.window.onDragDropEvent).toHaveBeenCalledTimes(1);
        expect(windowModule.isPreparingToExit()).toBe(false);

        mocks.eventHandlers.get("app://prepare-for-exit")?.({
            payload: undefined,
        });

        expect(windowModule.isPreparingToExit()).toBe(true);
        expect(handlePrepareForExit).toHaveBeenCalledOnce();

        const syncHandler = mocks.eventHandlers.get(
            "app://request-exit-guard-sync",
        );

        syncHandler?.({ payload: 3 });
        syncHandler?.({ payload: 0 });
        syncHandler?.({ payload: "not-a-number" });

        expect(handleExitGuardSync).toHaveBeenCalledOnce();
        expect(handleExitGuardSync).toHaveBeenCalledWith(3);
    });

    it("forwards only dropped file paths to dropped-file subscribers", async () => {
        const windowModule = await loadWindowModule();
        const handleDroppedFiles = vi.fn();

        windowModule.subscribeToDroppedFiles(handleDroppedFiles);

        await windowModule.initializeWindowShell();

        mocks.dragDropHandler?.({
            payload: {
                type: "over",
            },
        });
        mocks.dragDropHandler?.({
            payload: {
                type: "drop",
                paths: ["", "/tmp/alpha.lua", "/tmp/beta.luau"],
            },
        });
        mocks.dragDropHandler?.({
            payload: {
                type: "leave",
            },
        });

        expect(handleDroppedFiles).toHaveBeenCalledTimes(1);
        expect(handleDroppedFiles).toHaveBeenCalledWith([
            "/tmp/alpha.lua",
            "/tmp/beta.luau",
        ]);
    });

    it("forwards native file-drag hover state to hover subscribers", async () => {
        const windowModule = await loadWindowModule();
        const handleHoverState = vi.fn();

        windowModule.subscribeToDroppedFilesHover(handleHoverState);

        await windowModule.initializeWindowShell();

        mocks.dragDropHandler?.({
            payload: {
                type: "enter",
                paths: ["/tmp/alpha.lua"],
            },
        });
        mocks.dragDropHandler?.({
            payload: {
                type: "over",
            },
        });
        mocks.dragDropHandler?.({
            payload: {
                type: "leave",
            },
        });
        mocks.dragDropHandler?.({
            payload: {
                type: "drop",
                paths: ["/tmp/alpha.lua"],
            },
        });

        expect(handleHoverState).toHaveBeenNthCalledWith(1, true);
        expect(handleHoverState).toHaveBeenNthCalledWith(2, true);
        expect(handleHoverState).toHaveBeenNthCalledWith(3, false);
        expect(handleHoverState).toHaveBeenNthCalledWith(4, false);
    });

    it("forwards exit guard resolution to the backend command", async () => {
        const windowModule = await loadWindowModule();

        await windowModule.resolveExitGuardSync(7, true);

        expect(mocks.invoke).toHaveBeenCalledWith("resolve_exit_guard_sync", {
            shouldGuardExit: true,
            syncId: 7,
        });
    });

    it("returns safe browser fallbacks outside the desktop shell", async () => {
        mocks.isTauriEnvironment.mockReturnValue(false);
        const windowModule = await loadWindowModule();

        await expect(windowModule.startCurrentWindowDragging()).resolves.toBe(
            undefined,
        );
        await expect(windowModule.toggleCurrentWindowMaximize()).resolves.toBe(
            false,
        );
        await expect(windowModule.resolveExitGuardSync(5, true)).resolves.toBe(
            undefined,
        );

        expect(mocks.window.startDragging).not.toHaveBeenCalled();
        expect(mocks.window.toggleMaximize).not.toHaveBeenCalled();
        expect(mocks.invoke).not.toHaveBeenCalled();
    });
});
