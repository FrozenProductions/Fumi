import {
    Calendar01Icon,
    CheckmarkCircle01Icon,
    Copy01Icon,
    EyeIcon,
    FileAddIcon,
    Key01Icon,
    Link01Icon,
    Loading02Icon,
    StarIcon,
    Tick01Icon,
    UserCheck01Icon,
} from "@hugeicons/core-free-icons";
import type { ReactElement } from "react";
import { formatScriptLibraryDate } from "../../lib/scriptLibrary/scriptLibrary";
import { AppIcon } from "../app/AppIcon";
import { AppTooltip } from "../app/AppTooltip";
import type { ScriptLibraryCardProps } from "./scriptLibrary.type";

export function ScriptLibraryCard({
    script,
    viewFormat,
    actions,
}: ScriptLibraryCardProps): ReactElement {
    const {
        hasWorkspace,
        isAddingToWorkspace,
        isAddedToWorkspace,
        isCopyingScript,
        isCopiedLink,
        isCopiedScript,
        onAddToWorkspace,
        onCopyLink,
        onCopyScript,
    } = actions;

    return (
        <article
            className={`group flex justify-between rounded-[1.35rem] border border-fumi-200 bg-fumi-50 p-5 shadow-[var(--shadow-app-card)] transition-[transform,box-shadow,border-color] duration-200 hover:border-fumi-300 ${
                viewFormat === "grid"
                    ? "flex-col hover:-translate-y-1"
                    : "flex-row items-center gap-6 hover:-translate-y-0.5"
            }`}
        >
            <div className={viewFormat === "grid" ? "" : "min-w-0 flex-1"}>
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h3 className="truncate font-semibold leading-tight tracking-[-0.01em] text-fumi-900">
                            {script.title}
                        </h3>
                        <div className="mt-2 flex items-center gap-2 text-[11px] font-semibold text-fumi-400">
                            <span className="truncate">
                                @{script.creator.name}
                            </span>
                            {script.creator.verified ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-fumi-100 px-2 py-1 text-fumi-600">
                                    <AppIcon
                                        icon={UserCheck01Icon}
                                        size={11}
                                        strokeWidth={2.5}
                                    />
                                    Verified
                                </span>
                            ) : null}
                        </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                        {script.keySystem === false ? (
                            <div
                                title="Keyless"
                                className="flex size-6 items-center justify-center rounded-full bg-fumi-100 text-fumi-600"
                            >
                                <AppIcon
                                    icon={Key01Icon}
                                    size={12}
                                    strokeWidth={2.4}
                                />
                            </div>
                        ) : null}
                        {script.unpatched ? (
                            <div
                                title="Unpatched"
                                className="flex size-6 items-center justify-center rounded-full bg-fumi-100 text-fumi-600"
                            >
                                <AppIcon
                                    icon={CheckmarkCircle01Icon}
                                    size={12}
                                    strokeWidth={2.4}
                                />
                            </div>
                        ) : null}
                    </div>
                </div>

                <p
                    className={`mt-3 text-xs leading-5 text-fumi-400 ${
                        viewFormat === "grid" ? "line-clamp-3" : "line-clamp-1"
                    }`}
                >
                    {script.description}
                </p>
            </div>

            <div
                className={`flex justify-between ${
                    viewFormat === "grid"
                        ? "mt-5 items-center border-t border-fumi-100 pt-4"
                        : "shrink-0 flex-col items-end gap-2 border-l border-fumi-100 pl-6"
                }`}
            >
                <div
                    className={`app-select-none flex flex-wrap text-[11px] font-semibold text-fumi-400 ${
                        viewFormat === "grid" ? "gap-x-4 gap-y-2" : "gap-4"
                    }`}
                >
                    <span className="flex items-center gap-1.5" title="Views">
                        <AppIcon icon={EyeIcon} size={12} strokeWidth={2.5} />
                        {script.views}
                    </span>
                    <span className="flex items-center gap-1.5" title="Likes">
                        <AppIcon icon={StarIcon} size={12} strokeWidth={2.5} />
                        {script.likes}
                    </span>
                    <span
                        className="flex items-center gap-1.5"
                        title="Date Added"
                    >
                        <AppIcon
                            icon={Calendar01Icon}
                            size={12}
                            strokeWidth={2.5}
                        />
                        {formatScriptLibraryDate(script.createdAt)}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <AppTooltip
                        content={
                            hasWorkspace
                                ? "Add script to workspace"
                                : "Choose a workspace first"
                        }
                    >
                        <button
                            type="button"
                            disabled={!hasWorkspace || isAddingToWorkspace}
                            onClick={onAddToWorkspace}
                            className="app-select-none inline-flex size-8 items-center justify-center rounded-[0.65rem] border border-fumi-200 bg-fumi-50 text-fumi-600 transition-colors hover:bg-fumi-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 disabled:pointer-events-none disabled:opacity-50"
                            aria-label={
                                hasWorkspace
                                    ? "Add script to workspace"
                                    : "Choose a workspace first"
                            }
                        >
                            {isAddingToWorkspace ? (
                                <AppIcon
                                    icon={Loading02Icon}
                                    size={14}
                                    className="animate-spin"
                                />
                            ) : isAddedToWorkspace ? (
                                <AppIcon
                                    icon={Tick01Icon}
                                    size={14}
                                    strokeWidth={2.5}
                                />
                            ) : (
                                <AppIcon
                                    icon={FileAddIcon}
                                    size={14}
                                    strokeWidth={2.5}
                                />
                            )}
                        </button>
                    </AppTooltip>
                    <AppTooltip content="Copy link">
                        <button
                            type="button"
                            onClick={onCopyLink}
                            className="app-select-none inline-flex size-8 items-center justify-center rounded-[0.65rem] bg-fumi-50 text-fumi-600 transition-colors hover:bg-fumi-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 disabled:pointer-events-none disabled:opacity-70"
                            aria-label="Copy link"
                        >
                            {isCopiedLink ? (
                                <AppIcon
                                    icon={Tick01Icon}
                                    size={14}
                                    strokeWidth={2.5}
                                />
                            ) : (
                                <AppIcon
                                    icon={Link01Icon}
                                    size={14}
                                    strokeWidth={2.5}
                                />
                            )}
                        </button>
                    </AppTooltip>
                    <AppTooltip content="Copy script">
                        <button
                            type="button"
                            disabled={isCopyingScript}
                            onClick={onCopyScript}
                            className="app-select-none inline-flex size-8 items-center justify-center rounded-[0.65rem] bg-fumi-600 text-white transition-[background-color,transform] hover:bg-fumi-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 disabled:opacity-70"
                            aria-label="Copy script"
                        >
                            {isCopyingScript ? (
                                <AppIcon
                                    icon={Loading02Icon}
                                    size={14}
                                    className="animate-spin"
                                />
                            ) : isCopiedScript ? (
                                <AppIcon
                                    icon={Tick01Icon}
                                    size={14}
                                    strokeWidth={2.5}
                                />
                            ) : (
                                <AppIcon
                                    icon={Copy01Icon}
                                    size={14}
                                    strokeWidth={2.5}
                                />
                            )}
                        </button>
                    </AppTooltip>
                </div>
            </div>
        </article>
    );
}
