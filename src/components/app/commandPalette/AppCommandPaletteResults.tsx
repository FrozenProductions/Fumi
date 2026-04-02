import type { ReactElement } from "react";
import { AppIcon } from "../AppIcon";
import type { AppCommandPaletteResultsProps } from "./commandPalette.type";

export function AppCommandPaletteResults({
    activeResultIndex,
    isClosing,
    results,
    onCommitSelection,
    onHoverItem,
}: AppCommandPaletteResultsProps): ReactElement {
    const resultsMotionClassName = isClosing
        ? "motion-safe:motion-opacity-out-0 motion-safe:-motion-translate-y-out-[8%] motion-safe:motion-scale-out-[97%] motion-safe:motion-duration-160 motion-safe:motion-ease-in-quad"
        : "motion-safe:motion-opacity-in-0 motion-safe:-motion-translate-y-in-[10%] motion-safe:motion-duration-130 motion-safe:motion-delay-[20ms] motion-safe:motion-ease-out-cubic";

    return (
        <div
            className={[
                "origin-top rounded-[0.9rem] border bg-fumi-50 shadow-[var(--shadow-app-floating)] motion-reduce:animate-none motion-reduce:transform-none",
                resultsMotionClassName,
                results.length > 0
                    ? "max-h-[18rem] space-y-0.5 overflow-y-auto border-fumi-200 p-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    : "border-dashed border-fumi-200 px-3 py-5 text-center",
            ].join(" ")}
        >
            {results.length > 0 ? (
                results.map((item, index) => {
                    const isActive = index === activeResultIndex;

                    return (
                        <button
                            key={item.id}
                            type="button"
                            disabled={item.isDisabled}
                            onClick={() => onCommitSelection(item)}
                            onMouseEnter={() => onHoverItem(index)}
                            className={[
                                "flex w-full items-center gap-2 rounded-[0.75rem] border px-2 text-left transition-[background-color,border-color,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-2 focus-visible:ring-offset-fumi-50",
                                item.description ? "py-1.5" : "py-2",
                                item.isDisabled
                                    ? "cursor-default opacity-60"
                                    : "",
                                isActive
                                    ? "scale-[1.01] border-transparent bg-fumi-100/70"
                                    : "border-transparent bg-transparent hover:bg-fumi-100/50",
                            ].join(" ")}
                        >
                            <span
                                className={[
                                    "inline-flex size-7 shrink-0 items-center justify-center rounded-[0.65rem] border",
                                    isActive
                                        ? "border-fumi-200 bg-fumi-50 text-fumi-700"
                                        : "border-fumi-200 bg-fumi-50 text-fumi-500",
                                ].join(" ")}
                            >
                                <AppIcon
                                    icon={item.icon}
                                    size={13}
                                    strokeWidth={2.5}
                                />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-[12px] font-semibold text-fumi-800">
                                    {item.label}
                                </span>
                                {item.description ? (
                                    <span className="mt-px block truncate text-[10px] text-fumi-400">
                                        {item.description}
                                    </span>
                                ) : null}
                            </span>
                            {item.meta ? (
                                <span className="shrink-0 rounded-full border border-fumi-200 bg-fumi-50 px-1.5 py-0.5 text-[9px] font-semibold text-fumi-400">
                                    {item.meta}
                                </span>
                            ) : null}
                        </button>
                    );
                })
            ) : (
                <>
                    <p className="text-[13px] font-semibold text-fumi-700">
                        No matches
                    </p>
                    <p className="mt-1 text-[11px] text-fumi-400">
                        Try another keyword or switch scopes.
                    </p>
                </>
            )}
        </div>
    );
}
