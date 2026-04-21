import { type ReactElement, useEffect, useRef } from "react";
import type { ExecutorConsoleMessage } from "../../lib/workspace/workspace.type";

type WorkspaceExecutorOutputPanelProps = {
    isAttached: boolean;
    messages: readonly ExecutorConsoleMessage[];
    onClear: () => void;
};

function formatMessageTimestamp(receivedAt: number): string {
    return new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
    }).format(new Date(receivedAt));
}

export function WorkspaceExecutorOutputPanel({
    isAttached,
    messages,
    onClear,
}: WorkspaceExecutorOutputPanelProps): ReactElement | null {
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
    const previousMessageCountRef = useRef(0);

    useEffect(() => {
        const container = scrollContainerRef.current;
        const previousMessageCount = previousMessageCountRef.current;

        previousMessageCountRef.current = messages.length;

        if (!container || messages.length <= previousMessageCount) {
            return;
        }

        container.scrollTop = container.scrollHeight;
    }, [messages.length]);

    if (messages.length === 0) {
        return null;
    }

    return (
        <section className="border-t border-fumi-200 bg-fumi-100/40">
            <div className="flex items-center justify-between border-b border-fumi-200 px-3 py-2">
                <div>
                    <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-fumi-700">
                        Executor Output
                    </h3>
                    <p className="mt-0.5 text-[10px] font-semibold text-fumi-500">
                        {isAttached
                            ? "Live print() and error output."
                            : "Last captured output."}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onClear}
                    className="app-select-none inline-flex h-6 items-center justify-center rounded-md border border-fumi-200 bg-fumi-50 px-2.5 text-[10px] font-semibold text-fumi-600 transition-colors hover:bg-fumi-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600"
                >
                    Clear
                </button>
            </div>
            <div
                ref={scrollContainerRef}
                aria-live="polite"
                className="max-h-32 overflow-y-auto px-3 py-2 font-mono text-[11px] leading-relaxed text-fumi-800 [&::-webkit-scrollbar-thumb:hover]:bg-[rgb(var(--color-scrollbar-thumb-hover)/1)] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-[rgb(var(--color-scrollbar-thumb)/1)] [&::-webkit-scrollbar-thumb]:bg-clip-padding [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:h-[6px] [&::-webkit-scrollbar]:w-[6px]"
            >
                <div className="flex flex-col gap-1.5">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={
                                message.messageType === "error"
                                    ? "text-rose-700"
                                    : "text-fumi-800"
                            }
                        >
                            <span className="mr-2 text-[10px] font-semibold text-fumi-500">
                                {formatMessageTimestamp(message.receivedAt)}
                            </span>
                            <span className="whitespace-pre-wrap break-words">
                                {message.message}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
