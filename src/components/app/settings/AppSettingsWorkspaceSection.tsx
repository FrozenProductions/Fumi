import {
    ArchiveRestoreIcon,
    Delete02Icon,
    DeletePutBackIcon,
} from "@hugeicons/core-free-icons";
import type { ReactElement } from "react";
import { useAppStore } from "../../../hooks/app/useAppStore";
import type { UseWorkspaceSessionResult } from "../../../types/workspace/session";
import { AppIcon } from "../AppIcon";

type AppSettingsWorkspaceSectionProps = {
    workspaceSession: UseWorkspaceSessionResult;
};

export function AppSettingsWorkspaceSection({
    workspaceSession,
}: AppSettingsWorkspaceSectionProps): ReactElement {
    const theme = useAppStore((state) => state.theme);
    const workspace = workspaceSession.workspace;

    if (!workspace) {
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
                <p className="mt-4 text-sm font-semibold text-fumi-500">
                    No workspace open
                </p>
                <p className="mt-2 max-w-sm text-sm leading-[1.6] text-fumi-400">
                    Open a workspace to view and restore archived tabs.
                </p>
            </div>
        );
    }

    const handleRestoreTab = (tabId: string): void => {
        void workspaceSession.restoreArchivedWorkspaceTab(tabId);
    };

    const handleDeleteTab = (tabId: string): void => {
        void workspaceSession.deleteArchivedWorkspaceTab(tabId);
    };

    const deleteButtonClass =
        theme === "dark"
            ? "inline-flex h-8 items-center gap-1.5 rounded-[0.65rem] border border-rose-500/50 bg-rose-950/70 px-2.5 text-[11px] font-semibold text-rose-100 transition-[background-color,border-color,color] hover:border-rose-400 hover:bg-rose-900/80 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            : "inline-flex h-8 items-center gap-1.5 rounded-[0.65rem] border border-rose-200 bg-rose-50 px-2.5 text-[11px] font-semibold text-rose-700 transition-[background-color,border-color,color] hover:border-rose-300 hover:bg-rose-100 hover:text-rose-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500";

    if (workspace.archivedTabs.length === 0) {
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
                <p className="mt-4 text-sm font-semibold text-fumi-500">
                    No archived tabs yet
                </p>
                <p className="mt-2 max-w-sm text-sm leading-[1.6] text-fumi-400">
                    When you archive a tab it will appear here. You can restore
                    or permanently delete it at any time.
                </p>
            </div>
        );
    }

    return (
        <div className="flex w-full flex-col gap-3">
            {workspace.archivedTabs.map((tab) => (
                <div
                    key={tab.id}
                    className="flex items-center justify-between gap-3 rounded-[0.85rem] border border-fumi-200 bg-fumi-50 px-3 py-2.5"
                >
                    <div className="min-w-0">
                        <p className="truncate text-[0.8125rem] font-semibold text-fumi-900">
                            {tab.fileName}
                        </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <button
                            type="button"
                            onClick={() => handleRestoreTab(tab.id)}
                            className="inline-flex h-8 items-center gap-1.5 rounded-[0.65rem] border border-fumi-200 bg-fumi-100 px-2.5 text-[11px] font-semibold text-fumi-700 transition-[background-color,border-color,color] hover:border-fumi-300 hover:bg-fumi-200 hover:text-fumi-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600"
                        >
                            <AppIcon
                                icon={DeletePutBackIcon}
                                size={12}
                                strokeWidth={2.4}
                            />
                            Restore
                        </button>
                        <button
                            type="button"
                            onClick={() => handleDeleteTab(tab.id)}
                            className={deleteButtonClass}
                        >
                            <AppIcon
                                icon={Delete02Icon}
                                size={12}
                                strokeWidth={2.4}
                            />
                            Delete permanently
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
