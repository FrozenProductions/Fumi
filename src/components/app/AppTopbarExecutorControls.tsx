import { ArrowDown01Icon, ConnectIcon } from "@hugeicons/core-free-icons";
import { type ReactElement, useEffect, useRef, useState } from "react";
import { useAppStore } from "../../hooks/app/useAppStore";
import { AppIcon } from "./AppIcon";
import { AppTooltip } from "./AppTooltip";
import type { AppTopbarExecutorControlsProps } from "./appShell.type";

export function AppTopbarExecutorControls({
    hasSupportedExecutor,
    availablePorts,
    port,
    isAttached,
    didRecentAttachFail,
    isBusy,
    updatePort,
    toggleConnection,
}: AppTopbarExecutorControlsProps): ReactElement {
    const theme = useAppStore((state) => state.theme);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const isExecutorUnavailable = !hasSupportedExecutor;
    const isPrimaryButtonDisabled = isBusy || isExecutorUnavailable;
    const isDropdownDisabled = isBusy || isAttached || isExecutorUnavailable;

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsDropdownOpen(false);
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
                                ? theme === "dark"
                                    ? "bg-fumi-800 text-fumi-400"
                                    : "bg-fumi-100 text-fumi-400"
                                : didRecentAttachFail
                                  ? theme === "dark"
                                      ? "bg-amber-950/70 text-amber-100 hover:bg-amber-900/80"
                                      : "bg-amber-50 text-amber-800 hover:bg-amber-100"
                                  : "text-fumi-700 hover:bg-fumi-200"
                        } ${
                            isPrimaryButtonDisabled
                                ? isBusy
                                    ? "cursor-wait opacity-70"
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
                                className={`size-3.5 shrink-0 -translate-y-[0.25px] ${isBusy ? "opacity-50" : ""}`}
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
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        disabled={isDropdownDisabled}
                        data-topbar-interactive="true"
                        className={`app-select-none inline-flex h-full w-6 shrink-0 items-center justify-center rounded-r-md text-fumi-700 transition-[background-color,border-color] duration-150 hover:bg-fumi-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-2 focus-visible:ring-offset-fumi-100 ${
                            isDropdownDisabled
                                ? "cursor-not-allowed opacity-50"
                                : ""
                        }`}
                    >
                        <AppIcon
                            icon={ArrowDown01Icon}
                            className={`size-3.5 transition-transform duration-200 ${
                                isDropdownOpen ? "rotate-180" : ""
                            }`}
                            strokeWidth={2.5}
                        />
                    </button>
                </AppTooltip>
            </div>

            {isDropdownOpen ? (
                <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-36 origin-top-right overflow-y-auto rounded-[0.85rem] border border-fumi-200 bg-fumi-50 p-1.5 shadow-[var(--shadow-app-floating)] animate-fade-in max-h-64 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <div className="app-select-none mb-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-fumi-400">
                        Select Port
                    </div>
                    <div className="flex flex-col gap-0.5">
                        {availablePorts.map((availablePort) => {
                            const portValue = String(availablePort);
                            const isSelected = port === portValue;
                            return (
                                <button
                                    key={availablePort}
                                    type="button"
                                    onClick={() => {
                                        updatePort(portValue);
                                        setIsDropdownOpen(false);
                                    }}
                                    className={`app-select-none flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs transition-colors ${
                                        isSelected
                                            ? "bg-fumi-100 font-semibold text-fumi-800"
                                            : "font-medium text-fumi-500 hover:bg-fumi-100 hover:text-fumi-800"
                                    }`}
                                >
                                    <span>{availablePort}</span>
                                    {isSelected && (
                                        <span className="size-1.5 rounded-full bg-fumi-600" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
