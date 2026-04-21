import { ArrowDown01Icon, ConnectIcon } from "@hugeicons/core-free-icons";
import {
    type CSSProperties,
    type FocusEvent,
    type ReactElement,
    useEffect,
    useRef,
    useState,
} from "react";
import {
    EXECUTOR_PORT_DROPDOWN_ITEM_GAP_REM,
    EXECUTOR_PORT_DROPDOWN_ITEM_HEIGHT_REM,
    EXECUTOR_PORT_DROPDOWN_VISIBLE_COUNT,
} from "../../constants/workspace/executor";
import {
    WORKSPACE_MENU_INSET_REM,
    WORKSPACE_MENU_RADIUS_REM,
} from "../../constants/workspace/workspace";
import { useAppStore } from "../../hooks/app/useAppStore";
import { AppIcon } from "./AppIcon";
import { AppTooltip } from "./AppTooltip";
import type { AppTopbarExecutorControlsProps } from "./appShell.type";
import { getExecutorPortLabel } from "./executorPortLabel";

/**
 * Executor connection controls displayed in the topbar.
 *
 * @param props - Component props
 * @param props.state - Executor state information
 * @param props.actions - Executor action handlers
 * @returns A React component
 */
export function AppTopbarExecutorControls({
    actions,
    state,
}: AppTopbarExecutorControlsProps): ReactElement {
    const {
        availablePortSummaries,
        didRecentAttachFail,
        hasSupportedExecutor,
        isAttached,
        isBusy,
        port,
    } = state;
    const { toggleConnection, updatePort } = actions;
    const theme = useAppStore((state) => state.theme);
    const isStreamerModeEnabled = useAppStore(
        (state) => state.isStreamerModeEnabled,
    );
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [revealedPort, setRevealedPort] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isExecutorUnavailable = !hasSupportedExecutor;
    const isPrimaryButtonDisabled = isBusy || isExecutorUnavailable;
    const isDropdownDisabled = isBusy || isAttached || isExecutorUnavailable;
    const unavailableButtonClassName = `${theme === "dark" ? "bg-fumi-800" : "bg-fumi-100"} cursor-not-allowed text-fumi-400 opacity-60`;
    const dropdownStyle: CSSProperties & Record<string, string> = {
        "--executor-port-menu-radius": `${WORKSPACE_MENU_RADIUS_REM}rem`,
        "--executor-port-menu-inset": `${WORKSPACE_MENU_INSET_REM}rem`,
    };
    const dropdownViewportStyle = {
        maxHeight: `calc(${EXECUTOR_PORT_DROPDOWN_VISIBLE_COUNT} * ${EXECUTOR_PORT_DROPDOWN_ITEM_HEIGHT_REM}rem + (${EXECUTOR_PORT_DROPDOWN_VISIBLE_COUNT} - 1) * ${EXECUTOR_PORT_DROPDOWN_ITEM_GAP_REM}rem)`,
    } satisfies CSSProperties;

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsDropdownOpen(false);
                setRevealedPort(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative inline-flex items-center" ref={containerRef}>
            <div className="pointer-events-auto flex h-[1.625rem] items-center rounded-md border border-fumi-200 bg-fumi-50 text-fumi-700 transition-[background-color,border-color] duration-150">
                <AppTooltip
                    content={
                        isExecutorUnavailable
                            ? "No supported executor detected."
                            : didRecentAttachFail
                              ? `Could not connect to executor port ${port}`
                              : isAttached
                                ? "Disconnect from the active executor port"
                                : `Connect to executor port ${port}`
                    }
                    side="bottom"
                >
                    <button
                        type="button"
                        onClick={() => {
                            void toggleConnection();
                        }}
                        disabled={isPrimaryButtonDisabled}
                        data-topbar-interactive="true"
                        className={`app-select-none inline-flex h-full items-center justify-center gap-1.5 rounded-l-md px-2.5 text-xs font-semibold transition-[background-color,border-color,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-2 focus-visible:ring-offset-fumi-100 ${
                            isExecutorUnavailable
                                ? unavailableButtonClassName
                                : didRecentAttachFail
                                  ? theme === "dark"
                                      ? "bg-amber-950/70 text-amber-100 hover:bg-amber-900/80"
                                      : "bg-amber-50 text-amber-800 hover:bg-amber-100"
                                  : "text-fumi-700 hover:bg-fumi-200"
                        } ${
                            isPrimaryButtonDisabled
                                ? isBusy
                                    ? "cursor-wait opacity-70"
                                    : isExecutorUnavailable
                                      ? ""
                                      : "cursor-not-allowed opacity-60"
                                : ""
                        }`}
                    >
                        {isAttached ? (
                            <span
                                aria-hidden="true"
                                className="block size-1.5 shrink-0 translate-y-[0.25px] rounded-full bg-emerald-500 shadow-[0_0_0_2px_rgb(16_185_129_/_0.2)]"
                            />
                        ) : (
                            <AppIcon
                                icon={ConnectIcon}
                                className={`size-3.5 shrink-0 -translate-y-[0.25px] ${
                                    isExecutorUnavailable ? "text-fumi-400" : ""
                                } ${isBusy ? "opacity-50" : ""}`}
                                strokeWidth={2.5}
                            />
                        )}
                        <span className="translate-y-[0.5px]">
                            {isBusy
                                ? "Working"
                                : isExecutorUnavailable
                                  ? "Unavailable"
                                  : isAttached
                                    ? "Detach"
                                    : didRecentAttachFail
                                      ? "Failed"
                                      : "Attach"}
                        </span>
                    </button>
                </AppTooltip>

                <div className="h-4 w-px bg-fumi-200" />

                <AppTooltip content="Select executor port" side="bottom">
                    <button
                        type="button"
                        onClick={() =>
                            setIsDropdownOpen((open) => {
                                const nextIsOpen = !open;

                                if (!nextIsOpen) {
                                    setRevealedPort(null);
                                }

                                return nextIsOpen;
                            })
                        }
                        disabled={isDropdownDisabled}
                        data-topbar-interactive="true"
                        className={`app-select-none inline-flex h-full w-6 shrink-0 items-center justify-center rounded-r-md text-fumi-700 transition-[background-color,border-color,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-2 focus-visible:ring-offset-fumi-100 ${
                            isDropdownDisabled ? "" : "hover:bg-fumi-200"
                        } ${
                            isExecutorUnavailable
                                ? unavailableButtonClassName
                                : isDropdownDisabled
                                  ? "cursor-not-allowed opacity-50"
                                  : ""
                        }`}
                    >
                        <AppIcon
                            icon={ArrowDown01Icon}
                            className={`size-3.5 transition-transform duration-200 ${
                                isDropdownOpen ? "rotate-180" : ""
                            } ${isExecutorUnavailable ? "text-fumi-400" : ""}`}
                            strokeWidth={2.5}
                        />
                    </button>
                </AppTooltip>
            </div>

            {isDropdownOpen ? (
                <div
                    style={dropdownStyle}
                    className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-48 origin-top-right overflow-hidden rounded-[var(--executor-port-menu-radius)] border border-fumi-200 bg-fumi-50 p-1.5 shadow-[var(--shadow-app-floating)] animate-fade-in"
                >
                    <div className="app-select-none mb-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-fumi-400">
                        Select Port
                    </div>
                    <div
                        style={dropdownViewportStyle}
                        className="overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    >
                        <div className="flex flex-col gap-0.5">
                            {availablePortSummaries.map(
                                (availablePortSummary) => {
                                    const portValue = String(
                                        availablePortSummary.port,
                                    );
                                    const isSelected = port === portValue;
                                    const isMasked =
                                        isStreamerModeEnabled &&
                                        revealedPort !==
                                            availablePortSummary.port;
                                    const label = getExecutorPortLabel(
                                        availablePortSummary,
                                        {
                                            isMasked,
                                        },
                                    );
                                    const shouldBlurPortLabel =
                                        isMasked &&
                                        availablePortSummary.boundAccountDisplayName !==
                                            null;

                                    function handleRevealExecutorPort(): void {
                                        setRevealedPort(
                                            availablePortSummary.port,
                                        );
                                    }

                                    function handleHideExecutorPort(
                                        currentTarget: HTMLButtonElement,
                                        relatedTarget: EventTarget | null = null,
                                    ): void {
                                        if (
                                            relatedTarget instanceof Node &&
                                            currentTarget.contains(
                                                relatedTarget,
                                            )
                                        ) {
                                            return;
                                        }

                                        if (
                                            currentTarget.contains(
                                                document.activeElement,
                                            )
                                        ) {
                                            return;
                                        }

                                        if (currentTarget.matches(":hover")) {
                                            return;
                                        }

                                        setRevealedPort((currentPort) =>
                                            currentPort ===
                                            availablePortSummary.port
                                                ? null
                                                : currentPort,
                                        );
                                    }

                                    function handleExecutorPortBlur(
                                        event: FocusEvent<HTMLButtonElement>,
                                    ): void {
                                        handleHideExecutorPort(
                                            event.currentTarget,
                                            event.relatedTarget,
                                        );
                                    }

                                    return (
                                        <button
                                            key={availablePortSummary.port}
                                            type="button"
                                            onPointerEnter={
                                                handleRevealExecutorPort
                                            }
                                            onPointerLeave={(event) =>
                                                handleHideExecutorPort(
                                                    event.currentTarget,
                                                )
                                            }
                                            onFocus={handleRevealExecutorPort}
                                            onBlur={handleExecutorPortBlur}
                                            onClick={() => {
                                                updatePort(portValue);
                                                setIsDropdownOpen(false);
                                                setRevealedPort(null);
                                            }}
                                            className={`app-select-none flex h-10 w-full items-center justify-between gap-3 rounded-[calc(var(--executor-port-menu-radius)-var(--executor-port-menu-inset))] px-2.5 text-left transition-colors ${
                                                isSelected
                                                    ? "bg-fumi-100 font-semibold text-fumi-800"
                                                    : "font-medium text-fumi-500 hover:bg-fumi-100 hover:text-fumi-800"
                                            }`}
                                        >
                                            <div className="min-w-0">
                                                <span className="block text-xs">
                                                    {availablePortSummary.port}
                                                </span>
                                                <span
                                                    className={`mt-0.5 block truncate text-[10px] font-medium text-fumi-400 transition-[filter] duration-150 ${
                                                        shouldBlurPortLabel
                                                            ? "blur-[0.20rem]"
                                                            : "blur-0"
                                                    }`}
                                                >
                                                    {label}
                                                </span>
                                            </div>
                                            <div className="shrink-0">
                                                {isSelected ? (
                                                    <span className="block size-1.5 rounded-full bg-fumi-600" />
                                                ) : null}
                                            </div>
                                        </button>
                                    );
                                },
                            )}
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
