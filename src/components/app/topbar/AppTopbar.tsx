import {
    PanelLeftCloseIcon,
    PanelLeftOpenIcon,
} from "@hugeicons/core-free-icons";
import type { CSSProperties, MouseEvent, ReactElement } from "react";
import { useAppStore } from "../../../hooks/app/useAppStore";
import { getAppHotkeyShortcutLabel } from "../../../lib/app/hotkeys/hotkeys";
import {
    formatWorkspaceTooltipPath,
    getAnimatedTitleCharacters,
    isTopbarInteractiveTarget,
} from "../../../lib/app/topbar";
import {
    startCurrentWindowDragging,
    toggleCurrentWindowMaximize,
} from "../../../lib/platform/window";
import { AppIcon } from "../common/AppIcon";
import { AppIconButton } from "../common/AppIconButton";
import type { AppTopbarProps } from "../shell/appShell.type";
import { AppTooltip } from "../tooltip/AppTooltip";
import { AppTopbarExecutorControls } from "./AppTopbarExecutorControls";
import { AppTopbarTrafficLights } from "./AppTopbarTrafficLights";

type AppTopbarTitleLetterStyle = CSSProperties & {
    "--title-letter-x": string;
};

function createTitleLetterStyle(offsetX: number): AppTopbarTitleLetterStyle {
    return {
        "--title-letter-x": `${offsetX}px`,
    };
}

/**
 * The top bar containing window controls, sidebar toggle, and workspace info.
 *
 * @param props - Component props
 * @param props.title - Window title to display
 * @param props.isSidebarOpen - Whether the sidebar is open
 * @param props.onToggleSidebar - Callback to toggle sidebar
 * @param props.workspaceName - Current workspace name
 * @param props.workspacePath - Current workspace path
 * @param props.onOpenWorkspace - Callback to open workspace directory
 * @param props.executorControls - Executor controls to render
 * @returns A React component
 */
export function AppTopbar({
    title,
    isSidebarOpen,
    sidebarPosition,
    onToggleSidebar,
    workspaceName,
    workspacePath,
    onOpenWorkspace,
    executorControls,
}: AppTopbarProps): ReactElement {
    const hotkeyBindings = useAppStore((state) => state.hotkeyBindings);
    const animatedTitleCharacters = getAnimatedTitleCharacters(title);
    const toggleSidebarShortcutLabel = getAppHotkeyShortcutLabel(
        "TOGGLE_SIDEBAR",
        hotkeyBindings,
    );
    const openWorkspaceShortcutLabel = getAppHotkeyShortcutLabel(
        "OPEN_WORKSPACE_DIRECTORY",
        hotkeyBindings,
    );

    const handleTopbarMouseDown = (event: MouseEvent<HTMLElement>): void => {
        if (event.button !== 0 || isTopbarInteractiveTarget(event.target)) {
            return;
        }

        event.preventDefault();

        if (event.detail === 2) {
            void toggleCurrentWindowMaximize();
            return;
        }

        void startCurrentWindowDragging();
    };

    return (
        <header
            className="relative z-20 box-border flex h-11 shrink-0 items-center gap-1.5 border-b border-fumi-200 bg-fumi-100 pl-[4rem] pr-3 select-none [cursor:default] [-webkit-user-select:none]"
            onMouseDownCapture={handleTopbarMouseDown}
        >
            <AppTopbarTrafficLights />
            <div className="pointer-events-none absolute left-[4.8rem] top-1/2 z-10 h-4 w-0.5 -translate-y-1/2 rounded-full bg-fumi-300" />
            <div className="relative z-10 ml-5 flex items-center gap-1.5">
                <AppTooltip
                    content={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
                    side="bottom"
                    shortcut={toggleSidebarShortcutLabel}
                >
                    <AppIconButton
                        ariaLabel={
                            isSidebarOpen ? "Close sidebar" : "Open sidebar"
                        }
                        onClick={onToggleSidebar}
                        data-topbar-interactive="true"
                    >
                        {isSidebarOpen ? (
                            <AppIcon
                                aria-hidden="true"
                                icon={PanelLeftCloseIcon}
                                className={`pointer-events-none block size-[1.15rem] [-webkit-user-drag:none] ${sidebarPosition === "right" ? "rotate-180" : ""}`}
                                strokeWidth={2.25}
                            />
                        ) : (
                            <AppIcon
                                aria-hidden="true"
                                icon={PanelLeftOpenIcon}
                                className={`pointer-events-none block size-[1.15rem] [-webkit-user-drag:none] ${sidebarPosition === "right" ? "rotate-180" : ""}`}
                                strokeWidth={2.25}
                            />
                        )}
                    </AppIconButton>
                </AppTooltip>
            </div>

            <div className="relative z-10 mx-3 flex min-w-0 flex-1 items-center justify-center self-stretch">
                <div className="group relative inline-flex items-center justify-center px-3 py-2">
                    <span className="pointer-events-none inline-flex text-sm font-semibold tracking-[0.02em] text-fumi-900">
                        {animatedTitleCharacters.map(
                            ({ char, key, offsetX }) => (
                                <span
                                    key={key}
                                    className="inline-block [transition:transform_260ms_cubic-bezier(0.22,1,0.36,1),color_220ms_ease-out] [will-change:transform,color] group-hover:text-fumi-700 group-hover:[transform:translateX(var(--title-letter-x,0))]"
                                    style={createTitleLetterStyle(offsetX)}
                                >
                                    {char}
                                </span>
                            ),
                        )}
                    </span>
                </div>
            </div>

            <div className="relative z-10 ml-auto flex items-center gap-2">
                {executorControls ? (
                    <AppTopbarExecutorControls {...executorControls} />
                ) : null}
                {workspaceName && onOpenWorkspace ? (
                    <AppTooltip
                        content={formatWorkspaceTooltipPath(workspacePath)}
                        shortcut={openWorkspaceShortcutLabel}
                        side="bottom"
                    >
                        <button
                            type="button"
                            onClick={onOpenWorkspace}
                            data-topbar-interactive="true"
                            className="pointer-events-auto flex max-w-[12rem] items-center gap-1.5 rounded-md border border-fumi-200 bg-fumi-50 px-2.5 py-1 text-xs font-semibold text-fumi-700 transition-[background-color,border-color] duration-150 hover:border-fumi-200 hover:bg-fumi-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-2 focus-visible:ring-offset-fumi-100"
                        >
                            <span className="truncate">{workspaceName}</span>
                        </button>
                    </AppTooltip>
                ) : null}
            </div>
        </header>
    );
}
