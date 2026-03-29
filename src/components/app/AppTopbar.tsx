import {
    PanelLeftCloseIcon,
    PanelLeftOpenIcon,
} from "@hugeicons/core-free-icons";
import type { CSSProperties, MouseEvent, ReactElement } from "react";
import { APP_HOTKEYS } from "../../constants/app/hotkeys";
import {
    startCurrentWindowDragging,
    toggleCurrentWindowMaximize,
} from "../../lib/platform/window";
import { AppIcon } from "./AppIcon";
import { AppIconButton } from "./AppIconButton";
import { AppTooltip } from "./AppTooltip";

type AppTopbarProps = {
    title: string;
    isSidebarOpen: boolean;
    onToggleSidebar: () => void;
    workspaceName?: string | null;
    workspacePath?: string | null;
    onOpenWorkspace?: () => void;
};

function formatWorkspaceTooltipPath(
    workspacePath: string | null | undefined,
): string {
    if (!workspacePath) {
        return "Open a workspace";
    }

    return workspacePath
        .replace(/^\/Users\/[^/]+/, "~")
        .replace(/^\/home\/[^/]+/, "~");
}

const TOPBAR_INTERACTIVE_SELECTOR = [
    "button",
    "input",
    "select",
    "textarea",
    "a",
    "[role='button']",
    "[contenteditable='true']",
    "[data-topbar-interactive='true']",
].join(", ");

function isTopbarInteractiveTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
        return false;
    }

    return target.closest(TOPBAR_INTERACTIVE_SELECTOR) !== null;
}

export function AppTopbar({
    title,
    isSidebarOpen,
    onToggleSidebar,
    workspaceName,
    workspacePath,
    onOpenWorkspace,
}: AppTopbarProps): ReactElement {
    const animatedTitleCharacters = Array.from(title).map(
        (char, index, chars) => {
            const duplicateIndex = chars
                .slice(0, index)
                .filter((existingChar) => existingChar === char).length;

            return {
                char,
                index,
                key: `${char}-${duplicateIndex}`,
            };
        },
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
            className="relative z-20 box-border flex h-11 shrink-0 items-center gap-1.5 border-b border-fumi-200 bg-fumi-100 pl-[4.5rem] pr-3 select-none [cursor:default] [-webkit-user-select:none]"
            onMouseDownCapture={handleTopbarMouseDown}
        >
            <div className="pointer-events-none absolute left-[5.40rem] top-1/2 z-10 h-4 w-0.5 -translate-y-1/2 rounded-full bg-fumi-300" />
            <div className="relative z-10 ml-5 flex items-center gap-1.5">
                <AppTooltip
                    content={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
                    side="bottom"
                    shortcut={APP_HOTKEYS.TOGGLE_SIDEBAR.label}
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
                                className="pointer-events-none block size-[1.15rem] [-webkit-user-drag:none]"
                                strokeWidth={2.25}
                            />
                        ) : (
                            <AppIcon
                                aria-hidden="true"
                                icon={PanelLeftOpenIcon}
                                className="pointer-events-none block size-[1.15rem] [-webkit-user-drag:none]"
                                strokeWidth={2.25}
                            />
                        )}
                    </AppIconButton>
                </AppTooltip>
            </div>

            <div className="relative z-10 mx-3 flex min-w-0 flex-1 items-center justify-center self-stretch">
                <div className="group relative inline-flex items-center justify-center px-3 py-2">
                    <span className="pointer-events-none inline-flex text-sm font-semibold tracking-[0.02em] text-fumi-900">
                        {animatedTitleCharacters.map(({ char, index, key }) => {
                            const mid = (title.length - 1) / 2;
                            const offsetX = (index - mid) * 4.25;

                            return (
                                <span
                                    key={key}
                                    className="inline-block [transition:transform_260ms_cubic-bezier(0.22,1,0.36,1),color_220ms_ease-out] [will-change:transform,color] group-hover:text-fumi-700 group-hover:[transform:translateX(var(--title-letter-x,0))]"
                                    style={
                                        {
                                            "--title-letter-x": `${offsetX}px`,
                                        } as CSSProperties
                                    }
                                >
                                    {char}
                                </span>
                            );
                        })}
                    </span>
                </div>
            </div>

            <div className="relative z-10 ml-auto flex items-center">
                {workspaceName && onOpenWorkspace ? (
                    <AppTooltip
                        content={formatWorkspaceTooltipPath(workspacePath)}
                        shortcut={APP_HOTKEYS.OPEN_WORKSPACE_DIRECTORY.label}
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
