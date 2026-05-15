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
