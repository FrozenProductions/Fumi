import { ArchiveRestoreIcon } from "@hugeicons/core-free-icons";
import type { ReactElement } from "react";
import { AppIcon } from "../../AppIcon";
import type { AppSettingsWorkspaceEmptyStateProps } from "./workspaceSettings.type";

export function AppSettingsWorkspaceEmptyState({
    title,
    description,
}: AppSettingsWorkspaceEmptyStateProps): ReactElement {
    return (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-fumi-100 ring-1 ring-fumi-200">
                <AppIcon
                    icon={ArchiveRestoreIcon}
                    size={22}
                    strokeWidth={2}
                    className="text-fumi-400"
                />
            </div>
            <p className="mt-4 text-sm font-semibold text-fumi-500">{title}</p>
            <p className="mt-2 max-w-sm text-sm leading-[1.6] text-fumi-400">
                {description}
            </p>
        </div>
    );
}
