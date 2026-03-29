import { Add01Icon, Menu02Icon } from "@hugeicons/core-free-icons";
import { type ReactElement, useEffect, useRef } from "react";
import { APP_HOTKEYS } from "../../constants/app/hotkeys";
import type { UseWorkspaceTabRenameResult } from "../../hooks/workspace/useWorkspaceTabRename";
import { useWorkspaceUiStore } from "../../hooks/workspace/useWorkspaceUiStore";
import type { WorkspaceSession } from "../../types/workspace/session";
import { AppIcon } from "../app/AppIcon";
import { AppTooltip } from "../app/AppTooltip";
import { WorkspaceTabItem } from "./tabBar/WorkspaceTabItem";
import { WorkspaceTabListDropdown } from "./tabBar/WorkspaceTabListDropdown";

type WorkspaceTabBarProps = {
    workspace: WorkspaceSession;
    renameState: UseWorkspaceTabRenameResult;
    onCreateFile: () => void;
    onSelectTab: (tabId: string) => void;
    onArchiveTab: (tabId: string) => void;
};

export function WorkspaceTabBar({
    workspace,
    renameState,
    onCreateFile,
    onSelectTab,
    onArchiveTab,
}: WorkspaceTabBarProps): ReactElement {
    const tabListContainerRef = useRef<HTMLDivElement | null>(null);
    const tabListDropdownRef = useRef<HTMLDivElement | null>(null);
    const isTabListOpen = useWorkspaceUiStore((state) => state.isTabListOpen);
    const closeTabList = useWorkspaceUiStore((state) => state.closeTabList);
    const toggleTabList = useWorkspaceUiStore((state) => state.toggleTabList);
    const activeTabId = workspace.activeTabId;
    const {
        hasRenameError,
        isRenameSubmitting,
        renameInputRef,
        renameValue,
        renamingTabId,
        handleRenameInputBlur,
        handleRenameInputChange,
        handleRenameInputKeyDown,
        handleStartRename,
    } = renameState;

    useEffect(() => {
        if (!isTabListOpen) {
            return;
        }

        const handleClickOutside = (event: MouseEvent): void => {
            if (
                tabListDropdownRef.current?.contains(event.target as Node) ??
                false
            ) {
                return;
            }

            closeTabList();
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [closeTabList, isTabListOpen]);

    useEffect(() => {
        if (!activeTabId) {
            return;
        }

        const animationFrameId = window.requestAnimationFrame(() => {
            const tabElement =
                tabListContainerRef.current?.querySelector<HTMLElement>(
                    `[data-tab-id="${activeTabId}"]`,
                );

            tabElement?.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
                inline: "nearest",
            });
        });

        return () => {
            window.cancelAnimationFrame(animationFrameId);
        };
    }, [activeTabId]);

    return (
        <div className="shrink-0 flex items-center gap-2 border-b border-fumi-200 bg-fumi-100 px-2 py-1.5">
            <div
                ref={tabListContainerRef}
                role="tablist"
                aria-label="Workspace files"
                className="min-w-0 flex flex-1 items-center gap-2 overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {workspace.tabs.map((tab) => (
                    <WorkspaceTabItem
                        key={tab.id}
                        tab={tab}
                        isActive={tab.id === workspace.activeTabId}
                        onArchiveTab={onArchiveTab}
                        onSelectTab={onSelectTab}
                        handleRenameInputBlur={handleRenameInputBlur}
                        handleRenameInputChange={handleRenameInputChange}
                        handleRenameInputKeyDown={handleRenameInputKeyDown}
                        handleStartRename={handleStartRename}
                        hasRenameError={hasRenameError}
                        isRenameSubmitting={isRenameSubmitting}
                        renameInputRef={renameInputRef}
                        renameValue={renameValue}
                        renamingTabId={renamingTabId}
                    />
                ))}
            </div>
            <div
                ref={tabListDropdownRef}
                className="relative ml-auto flex shrink-0 items-center gap-1"
            >
                <AppTooltip content="Tab list" side="bottom">
                    <button
                        type="button"
                        onClick={toggleTabList}
                        aria-expanded={isTabListOpen}
                        aria-haspopup="menu"
                        className={[
                            "inline-flex size-7 items-center justify-center rounded-md border text-fumi-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-1 focus-visible:ring-offset-fumi-100",
                            isTabListOpen
                                ? "border-fumi-300 bg-fumi-50 text-fumi-600"
                                : "border-fumi-200 bg-fumi-50 hover:border-fumi-300 hover:bg-fumi-100 hover:text-fumi-600",
                        ].join(" ")}
                    >
                        <AppIcon
                            icon={Menu02Icon}
                            size={14}
                            strokeWidth={2.5}
                        />
                    </button>
                </AppTooltip>

                {isTabListOpen ? (
                    <WorkspaceTabListDropdown
                        workspace={workspace}
                        onClose={closeTabList}
                        onSelectTab={onSelectTab}
                    />
                ) : null}

                <div className="mx-0.5 h-4 w-[1px] bg-fumi-200" />

                <AppTooltip
                    content="New file"
                    side="bottom"
                    shortcut={APP_HOTKEYS.CREATE_WORKSPACE_FILE.label}
                >
                    <button
                        type="button"
                        onClick={onCreateFile}
                        className="inline-flex size-7 items-center justify-center rounded-md border border-fumi-200 bg-fumi-50 text-fumi-500 transition-colors hover:border-fumi-300 hover:bg-fumi-100 hover:text-fumi-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-1 focus-visible:ring-offset-fumi-100"
                    >
                        <AppIcon icon={Add01Icon} size={14} strokeWidth={2.5} />
                    </button>
                </AppTooltip>
            </div>
        </div>
    );
}
