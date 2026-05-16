import type { FocusEvent, ReactElement } from "react";
import type { AppTopbarExecutorControlsProps } from "./appTopbar.type";
import { getExecutorPortLabel } from "./getExecutorPortLabel";

type AppTopbarExecutorPortOptionProps = {
    port: string;
    portSummary: AppTopbarExecutorControlsProps["state"]["availablePortSummaries"][number];
    revealedPort: number | null;
    isStreamerModeEnabled: boolean;
    onClearRevealedPort: (port: number) => void;
    onRevealPort: (port: number) => void;
    onSelectPort: (port: string) => void;
};

/**
 * Renders a single executor port option in the topbar dropdown.
 *
 * Displays the port label with streamer mode masking support. Handles
 * port selection and reveal/hide interactions for privacy control.
 *
 * @param props - Component configuration
 * @param props.port - The port value string
 * @param props.portSummary - Summary data for the port
 * @param props.revealedPort - Currently revealed port (for masking)
 * @param props.isStreamerModeEnabled - Whether streamer mode is active
 * @param props.onClearRevealedPort - Called to hide the port
 * @param props.onRevealPort - Called to reveal the port
 * @param props.onSelectPort - Called when the port is selected
 * @returns A React component
 */
export function AppTopbarExecutorPortOption({
    port,
    portSummary,
    revealedPort,
    isStreamerModeEnabled,
    onClearRevealedPort,
    onRevealPort,
    onSelectPort,
}: AppTopbarExecutorPortOptionProps): ReactElement {
    const portValue = String(portSummary.port);
    const isSelected = port === portValue;
    const isMasked = isStreamerModeEnabled && revealedPort !== portSummary.port;
    const label = getExecutorPortLabel(portSummary, {
        isMasked,
    });
    const shouldBlurPortLabel =
        isMasked && portSummary.boundAccountDisplayName !== null;

    function handleRevealExecutorPort(): void {
        onRevealPort(portSummary.port);
    }

    function handleHideExecutorPort(
        currentTarget: HTMLButtonElement,
        relatedTarget: EventTarget | null = null,
    ): void {
        if (
            relatedTarget instanceof Node &&
            currentTarget.contains(relatedTarget)
        ) {
            return;
        }

        if (currentTarget.contains(document.activeElement)) {
            return;
        }

        if (currentTarget.matches(":hover")) {
            return;
        }

        onClearRevealedPort(portSummary.port);
    }

    function handleExecutorPortBlur(
        event: FocusEvent<HTMLButtonElement>,
    ): void {
        handleHideExecutorPort(event.currentTarget, event.relatedTarget);
    }

    return (
        <button
            type="button"
            onPointerEnter={handleRevealExecutorPort}
            onPointerLeave={(event) =>
                handleHideExecutorPort(event.currentTarget)
            }
            onFocus={handleRevealExecutorPort}
            onBlur={handleExecutorPortBlur}
            onClick={() => onSelectPort(portValue)}
            className={`app-select-none flex h-10 w-full items-center justify-between gap-3 rounded-[calc(var(--executor-port-menu-radius)-var(--executor-port-menu-inset))] px-2.5 text-left transition-colors ${
                isSelected
                    ? "bg-fumi-100 font-semibold text-fumi-800"
                    : "font-medium text-fumi-500 hover:bg-fumi-100 hover:text-fumi-800"
            }`}
        >
            <div className="min-w-0">
                <span className="block text-xs">{portSummary.port}</span>
                <span
                    className={`mt-0.5 block truncate text-[10px] font-medium text-fumi-400 transition-[filter] duration-150 ${
                        shouldBlurPortLabel ? "blur-[0.20rem]" : "blur-0"
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
}
