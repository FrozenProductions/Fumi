import type { ReactElement } from "react";
import archiveIcon from "../../../../assets/icons/archive.svg";
import type { AppSettingsWorkspaceEmptyStateProps } from "./appSettingsWorkspace.type";

export function AppSettingsWorkspaceEmptyState({
    title,
    description,
}: AppSettingsWorkspaceEmptyStateProps): ReactElement {
    return (
        <div className="flex min-h-0 flex-1 items-center justify-center p-8">
            <div className="mx-auto flex max-w-lg flex-col items-center text-center">
                <div
                    aria-hidden="true"
                    className="mx-auto h-24 w-24 bg-fumi-600"
                    style={{
                        mask: `url("${archiveIcon}") center / contain no-repeat`,
                        WebkitMask: `url("${archiveIcon}") center / contain no-repeat`,
                    }}
                />
                <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.32em] text-fumi-500">
                    {title}
                </p>
                <p className="mt-4 max-w-lg text-base leading-7 text-fumi-400">
                    {description}
                </p>
            </div>
        </div>
    );
}
