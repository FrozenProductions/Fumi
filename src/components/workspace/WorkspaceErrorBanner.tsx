import { Alert01Icon } from "@hugeicons/core-free-icons";
import type { ReactElement } from "react";
import { AppIcon } from "../app/AppIcon";
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
}: WorkspaceErrorBannerProps): ReactElement {
    return (
        <div className="shrink-0 border-b border-amber-200 bg-amber-50/80 px-4 py-2.5">
            <div className="flex items-start gap-2 text-[12px] text-amber-900">
                <AppIcon
                    icon={Alert01Icon}
                    size={14}
                    strokeWidth={2.4}
                    className="mt-0.5 shrink-0"
                />
                <p className="leading-5">{errorMessage}</p>
            </div>
        </div>
    );
}
