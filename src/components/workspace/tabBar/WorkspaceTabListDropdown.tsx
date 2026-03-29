import type { CSSProperties, ReactElement } from "react";
import {
    WORKSPACE_TAB_LIST_BOTTOM_PADDING_REM,
    WORKSPACE_TAB_LIST_HORIZONTAL_PADDING_REM,
    WORKSPACE_TAB_LIST_ITEM_HEIGHT_REM,
    WORKSPACE_TAB_LIST_TOP_PADDING_REM,
    WORKSPACE_TAB_LIST_VISIBLE_COUNT,
} from "../../../constants/workspace/workspace";
import { splitWorkspaceFileName } from "../../../lib/workspace/fileName";
import type { WorkspaceSession } from "../../../types/workspace/session";

const WORKSPACE_TAB_LIST_DROPDOWN_STYLE = {
    maxHeight: `calc(${WORKSPACE_TAB_LIST_VISIBLE_COUNT} * ${WORKSPACE_TAB_LIST_ITEM_HEIGHT_REM}rem + ${
        WORKSPACE_TAB_LIST_TOP_PADDING_REM +
        WORKSPACE_TAB_LIST_BOTTOM_PADDING_REM
    }rem)`,
    paddingBottom: `${WORKSPACE_TAB_LIST_BOTTOM_PADDING_REM}rem`,
    paddingInline: `${WORKSPACE_TAB_LIST_HORIZONTAL_PADDING_REM}rem`,
    paddingTop: `${WORKSPACE_TAB_LIST_TOP_PADDING_REM}rem`,
} satisfies CSSProperties;

type WorkspaceTabListDropdownProps = {
    workspace: WorkspaceSession;
    onClose: () => void;
    onSelectTab: (tabId: string) => void;
};

export function WorkspaceTabListDropdown({
    workspace,
    onClose,
    onSelectTab,
}: WorkspaceTabListDropdownProps): ReactElement {
    return (
        <div
            style={WORKSPACE_TAB_LIST_DROPDOWN_STYLE}
            className="absolute right-0 top-[calc(100%+0.25rem)] z-50 min-w-[140px] max-w-[200px] origin-top-right overflow-y-auto rounded-[0.85rem] border border-fumi-200 bg-fumi-50 shadow-[var(--shadow-app-floating)] animate-fade-in [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
            {workspace.tabs.map((tab) => {
                const { baseName } = splitWorkspaceFileName(tab.fileName);
                const isActive = tab.id === workspace.activeTabId;
                const isDirty = tab.content !== tab.savedContent;

                return (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                            onSelectTab(tab.id);
                            onClose();
                        }}
                        className={[
                            "flex h-8 w-full items-center justify-between gap-3 rounded-[0.5rem] px-2.5 text-left text-[11px] font-semibold tracking-wide transition-colors",
                            isActive
                                ? "bg-fumi-100 text-fumi-800"
                                : "text-fumi-500 hover:bg-fumi-50 hover:text-fumi-800",
                        ].join(" ")}
                    >
                        <span className="min-w-0 flex-1 truncate text-left">
                            {baseName}
                        </span>
                        {isDirty ? (
                            <span className="size-2 shrink-0 rounded-full bg-amber-500" />
                        ) : null}
                    </button>
                );
            })}
        </div>
    );
}
