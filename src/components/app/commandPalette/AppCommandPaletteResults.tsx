import type { CSSProperties, ReactElement } from "react";
import {
    APP_COMMAND_PALETTE_MAX_RESULTS,
    APP_COMMAND_PALETTE_RESULT_ROW_GAP_REM,
    APP_COMMAND_PALETTE_RESULT_ROW_HEIGHT_REM,
} from "../../../constants/app/commandPalette";
import {
    WORKSPACE_MENU_INSET_REM,
    WORKSPACE_MENU_RADIUS_REM,
} from "../../../constants/workspace/workspace";
import { joinClassNames } from "../../../lib/shared/className";
import { AppIcon } from "../common/AppIcon";
import type { AppCommandPaletteResultsProps } from "./appCommandPalette.type";

/**
 * The results list for the command palette.
 *
 * @param props - Component props
 * @param props.activeResultIndex - Currently selected result index
 * @param props.isClosing - Whether the palette is closing
 * @param props.results - Result items to display
 * @param props.onCommitSelection - Called when a result is selected
 * @param props.onHoverItem - Called when hovering a result
 * @returns A React component
 */
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
    const resultsStyle: CSSProperties & Record<string, string> = {
        "--command-results-menu-radius": `${WORKSPACE_MENU_RADIUS_REM}rem`,
        "--command-results-menu-inset": `${WORKSPACE_MENU_INSET_REM}rem`,
        "--command-results-item-radius":
            "calc(var(--command-results-menu-radius) - var(--command-results-menu-inset))",
        "--command-results-element-radius":
            "calc(var(--command-results-item-radius) - 0.125rem)",
    };
    const resultsViewportStyle = {
        maxHeight: `calc(${APP_COMMAND_PALETTE_MAX_RESULTS} * ${APP_COMMAND_PALETTE_RESULT_ROW_HEIGHT_REM}rem + (${APP_COMMAND_PALETTE_MAX_RESULTS} - 1) * ${APP_COMMAND_PALETTE_RESULT_ROW_GAP_REM}rem)`,
    } satisfies CSSProperties;
    const containerClassName = joinClassNames(
        "origin-top border bg-fumi-50 shadow-[var(--shadow-app-floating)] motion-reduce:animate-none motion-reduce:transform-none",
        resultsMotionClassName,
        results.length > 0
            ? "overflow-hidden rounded-[var(--command-results-menu-radius)] border-fumi-200 p-1.5"
            : "rounded-[0.9rem] border-dashed border-fumi-200 px-3 py-5 text-center",
    );

    return (
        <div
            style={results.length > 0 ? resultsStyle : undefined}
            className={containerClassName}
        >
            {results.length > 0 ? (
                <div
                    style={resultsViewportStyle}
                    className="overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                    <div className="flex flex-col gap-0.5">
                        {results.map((item, index) => {
                            const isActive = index === activeResultIndex;
                            const itemClassName = joinClassNames(
                                "app-select-none flex h-12 w-full items-center gap-2 rounded-[var(--command-results-item-radius)] border px-2 text-left transition-[background-color,border-color,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-2 focus-visible:ring-offset-fumi-50",
                                item.isDisabled && "cursor-default opacity-60",
                                isActive
                                    ? "scale-[1.01] border-transparent bg-fumi-100/70"
                                    : "border-transparent bg-transparent hover:bg-fumi-100/50",
                            );
                            const iconClassName = joinClassNames(
                                "inline-flex size-7 shrink-0 items-center justify-center rounded-[var(--command-results-element-radius)] border",
                                isActive
                                    ? "border-fumi-200 bg-fumi-50 text-fumi-700"
                                    : "border-fumi-200 bg-fumi-50 text-fumi-500",
                            );

                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    disabled={item.isDisabled}
                                    onClick={() => onCommitSelection(item)}
                                    onMouseEnter={() => onHoverItem(index)}
                                    className={itemClassName}
                                >
                                    <span className={iconClassName}>
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
                                        <span className="shrink-0 rounded-[var(--command-results-element-radius)] border border-fumi-200 bg-fumi-50 px-1.5 py-0.5 text-[9px] font-semibold text-fumi-400">
                                            {item.meta}
                                        </span>
                                    ) : null}
                                </button>
                            );
                        })}
                    </div>
                </div>
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
