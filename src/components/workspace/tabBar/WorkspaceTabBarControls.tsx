import {
    Add01Icon,
    Cancel01Icon,
    Menu02Icon,
} from "@hugeicons/core-free-icons";
import type { ReactElement } from "react";
import { AppIcon } from "../../app/common/AppIcon";
import { AppTooltip } from "../../app/tooltip/AppTooltip";
import { WorkspaceTabListDropdown } from "./WorkspaceTabListDropdown";
import type { WorkspaceTabBarControlsProps } from "./workspaceTabBar.type";

/**
 * Renders the trailing tab bar controls for split, list, and create actions.
 */
export function WorkspaceTabBarControls({
    refs,
    state,
    workspace,
    actions,
}: WorkspaceTabBarControlsProps): ReactElement {
    return (
        <div
            ref={refs.tabListDropdownRef}
            className="absolute inset-y-0 right-0 z-20 flex items-center gap-1 bg-fumi-100 px-2 py-1.5"
        >
            {state.isSplit ? (
                <AppTooltip
                    content="Close split view"
                    side="bottom"
                    shortcut={state.closeSplitViewShortcutLabel}
                >
                    <button
                        type="button"
                        aria-label="Close split view"
                        onClick={actions.onCloseSplitView}
                        className="app-select-none inline-flex size-7 items-center justify-center rounded-md border border-fumi-200 bg-fumi-50 text-fumi-500 transition-colors hover:border-fumi-300 hover:bg-fumi-100 hover:text-fumi-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-1 focus-visible:ring-offset-fumi-100"
                    >
                        <AppIcon
                            icon={Cancel01Icon}
                            size={14}
                            strokeWidth={2.5}
                        />
                    </button>
                </AppTooltip>
            ) : null}

            <AppTooltip content="Tab list" side="bottom">
                <button
                    type="button"
                    onClick={() => {
                        actions.closeContextMenu();
                        actions.toggleTabList();
                    }}
                    aria-expanded={state.isTabListOpen}
                    aria-haspopup="menu"
                    className={state.tabListButtonClassName}
                >
                    <AppIcon icon={Menu02Icon} size={14} strokeWidth={2.5} />
                </button>
            </AppTooltip>

            {state.isTabListOpen ? (
                <WorkspaceTabListDropdown
                    workspace={workspace}
                    onClose={actions.closeTabList}
                    onSelectTab={actions.onSelectTab}
                />
            ) : null}

            <div className="mx-0.5 h-4 w-[1px] bg-fumi-200" />

            <AppTooltip
                content="New file"
                side="bottom"
                shortcut={state.createFileShortcutLabel}
            >
                <button
                    type="button"
                    onClick={actions.onCreateFile}
                    className="app-select-none inline-flex size-7 items-center justify-center rounded-md border border-fumi-200 bg-fumi-50 text-fumi-500 transition-colors hover:border-fumi-300 hover:bg-fumi-100 hover:text-fumi-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-1 focus-visible:ring-offset-fumi-100"
                >
                    <AppIcon icon={Add01Icon} size={14} strokeWidth={2.5} />
                </button>
            </AppTooltip>
        </div>
    );
}
