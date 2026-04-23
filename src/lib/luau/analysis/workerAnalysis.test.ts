import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vite-plus/test";
import { scanLuauFileAnalysis } from "../symbolScanner/symbolScanner";

type MockWorkerListener = (event: { data?: unknown; error?: unknown }) => void;

type MockWorkerBehavior =
    | {
          type: "error";
          error: Error;
      }
    | {
          type: "result";
      };

class MockAnalysisWorker {
    static behaviors: MockWorkerBehavior[] = [];
    static instances: MockAnalysisWorker[] = [];

    private readonly listeners = {
        error: new Set<MockWorkerListener>(),
        message: new Set<MockWorkerListener>(),
    };

    readonly behavior: MockWorkerBehavior;
    postMessage = vi.fn((request: { content: string; id: number }) => {
        queueMicrotask(() => {
            if (this.behavior.type === "error") {
                this.emit("error", {
                    error: this.behavior.error,
                });
                return;
            }

            this.emit("message", {
                data: {
                    id: request.id,
                    type: "result",
                    analysis: scanLuauFileAnalysis(request.content),
                },
            });
        });
    });
    terminate = vi.fn();

    constructor() {
        this.behavior = MockAnalysisWorker.behaviors.shift() ?? {
            type: "result",
        };
        MockAnalysisWorker.instances.push(this);
    }

    addEventListener(type: "error" | "message", listener: MockWorkerListener) {
        this.listeners[type].add(listener);
    }

    removeEventListener(
        type: "error" | "message",
        listener: MockWorkerListener,
    ) {
        this.listeners[type].delete(listener);
    }

    private emit(
        type: "error" | "message",
        event: {
            data?: unknown;
            error?: unknown;
        },
    ): void {
        for (const listener of this.listeners[type]) {
            listener(event);
        }
    }
}

const originalWorker = globalThis.Worker;
const originalWindow = globalThis.window;

beforeEach(() => {
    vi.resetModules();
    MockAnalysisWorker.behaviors = [];
    MockAnalysisWorker.instances = [];
    Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: globalThis,
    });
});

afterEach(() => {
    if (originalWorker === undefined) {
        Reflect.deleteProperty(globalThis, "Worker");
    } else {
        Object.defineProperty(globalThis, "Worker", {
            configurable: true,
            value: originalWorker,
        });
    }

    if (originalWindow === undefined) {
        Reflect.deleteProperty(globalThis, "window");
    } else {
        Object.defineProperty(globalThis, "window", {
            configurable: true,
            value: originalWindow,
        });
    }

    vi.restoreAllMocks();
});

describe("analyzeLuauFileInBackground", () => {
    it("falls back to local analysis when workers are unavailable", async () => {
        Reflect.deleteProperty(globalThis, "Worker");

        const { analyzeLuauFileInBackground } = await import(
            "./workerAnalysis"
        );
        const analysis = await analyzeLuauFileInBackground({
            content: [
                "-- Utilities",
                "local function greet()",
                "    print('hi')",
                "end",
            ].join("\n"),
        });

        expect(
            analysis.symbols.some(
                (symbol) =>
                    symbol.kind === "function" && symbol.label === "greet",
            ),
        ).toBe(true);
    });

    it("recreates the worker after a failure instead of disabling it for the session", async () => {
        Object.defineProperty(globalThis, "Worker", {
            configurable: true,
            value: MockAnalysisWorker,
        });
        MockAnalysisWorker.behaviors = [
            {
                type: "error",
                error: new Error("worker crashed"),
            },
            {
                type: "result",
            },
        ];

        const { analyzeLuauFileInBackground } = await import(
            "./workerAnalysis"
        );
        const firstAnalysis = await analyzeLuauFileInBackground({
            content: "local function first() end",
        });
        const secondAnalysis = await analyzeLuauFileInBackground({
            content: "local function second() end",
        });

        expect(
            firstAnalysis.symbols.some((symbol) => symbol.label === "first"),
        ).toBe(true);
        expect(
            secondAnalysis.symbols.some((symbol) => symbol.label === "second"),
        ).toBe(true);
        expect(MockAnalysisWorker.instances).toHaveLength(2);
        expect(
            MockAnalysisWorker.instances[0]?.terminate,
        ).toHaveBeenCalledOnce();
        expect(
            MockAnalysisWorker.instances[1]?.postMessage,
        ).toHaveBeenCalledOnce();
    });
});
