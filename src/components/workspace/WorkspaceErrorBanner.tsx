import { Alert01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import type { ReactElement } from "react";
import { AppIcon } from "../app/AppIcon";
import { AppTooltip } from "../app/AppTooltip";
import type { WorkspaceErrorBannerProps } from "./workspaceFeedback.type";

/**
 * Displays an error message banner in the workspace.
 *
 * @param props - Component props
 * @param props.errorMessage - The error message to display
 * @returns A React component
 */
export function WorkspaceErrorBanner({
    errorMessage,
    onClose,
}: WorkspaceErrorBannerProps): ReactElement {
    return (
        <div className="shrink-0 border-b border-amber-200 bg-amber-50/80 py-2.5 pl-4 pr-2">
            <div className="flex items-center justify-between gap-3 text-[12px] text-amber-900">
                <div className="flex min-w-0 items-center gap-2">
                    <AppIcon
                        icon={Alert01Icon}
                        size={14}
                        strokeWidth={2.4}
                        className="shrink-0"
                    />
                    <p className="leading-5">{errorMessage}</p>
                </div>
                <AppTooltip content="Dismiss" side="left">
                    <button
                        type="button"
                        aria-label="Dismiss workspace error"
                        onClick={onClose}
                        className="app-select-none inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[0.55rem] text-amber-700 transition-[background-color,color] duration-150 ease-out hover:bg-amber-100 hover:text-amber-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-amber-50"
                    >
                        <AppIcon
                            icon={Cancel01Icon}
                            size={14}
                            strokeWidth={2.4}
                        />
                    </button>
                </AppTooltip>
            </div>
        </div>
    );
}
