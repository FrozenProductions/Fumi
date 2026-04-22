import type { ReactElement } from "react";
import { useMemo } from "react";
import { createMaskStyle } from "../../lib/shared/mask";
import { AppIcon } from "../app/AppIcon";
import { AppTooltip } from "../app/AppTooltip";
import type { WorkspaceMessageStateProps } from "./workspaceFeedback.type";

/**
 * Displays a centered message state with optional action button.
 *
 * @param props - Component props
 * @param props.eyebrow - Small label above the title
 * @param props.title - Main title text
 * @param props.description - Descriptive text
 * @param props.action - Optional action button configuration
 * @returns A React component
 */
export function WorkspaceMessageState({
    eyebrow,
    title,
    description,
    illustrationUrl,
    action,
}: WorkspaceMessageStateProps): ReactElement {
    const illustrationStyle = useMemo(
        () => (illustrationUrl ? createMaskStyle(illustrationUrl) : null),
        [illustrationUrl],
    );

    if (illustrationUrl) {
        return (
            <div className="flex flex-1 items-center justify-center bg-fumi-50/80 p-8">
                <div className="mx-auto flex max-w-lg flex-col items-center text-center">
                    <div
                        aria-hidden="true"
                        className="mx-auto h-24 w-24 bg-fumi-600"
                        style={illustrationStyle ?? undefined}
                    />
                    <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.32em] text-fumi-500">
                        {eyebrow}
                    </p>
                    {title ? (
                        <h3 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-fumi-900">
                            {title}
                        </h3>
                    ) : null}
                    <p
                        className={
                            title
                                ? "mt-3 text-sm leading-6 text-fumi-400"
                                : "mt-4 text-sm leading-6 text-fumi-400"
                        }
                    >
                        {description}
                    </p>
                    {action ? (
                        action.shortcut ? (
                            <AppTooltip
                                content={action.label}
                                shortcut={action.shortcut}
                            >
                                <button
                                    type="button"
                                    onClick={action.onClick}
                                    className="app-select-none mt-6 inline-flex h-10 items-center gap-2 rounded-[0.8rem] border border-fumi-200 bg-fumi-600 px-4 text-sm font-semibold tracking-[0.01em] text-white transition-[background-color,border-color,transform] duration-150 ease-out hover:-translate-y-0.5 hover:border-fumi-700 hover:bg-fumi-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-2 focus-visible:ring-offset-fumi-50"
                                >
                                    <AppIcon
                                        icon={action.icon}
                                        size={16}
                                        strokeWidth={2.4}
                                    />
                                    {action.label}
                                </button>
                            </AppTooltip>
                        ) : (
                            <button
                                type="button"
                                onClick={action.onClick}
                                className="app-select-none mt-6 inline-flex h-10 items-center gap-2 rounded-[0.8rem] border border-fumi-200 bg-fumi-600 px-4 text-sm font-semibold tracking-[0.01em] text-white transition-[background-color,border-color,transform] duration-150 ease-out hover:-translate-y-0.5 hover:border-fumi-700 hover:bg-fumi-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-2 focus-visible:ring-offset-fumi-50"
                            >
                                <AppIcon
                                    icon={action.icon}
                                    size={16}
                                    strokeWidth={2.4}
                                />
                                {action.label}
                            </button>
                        )
                    ) : null}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-1 items-center justify-center bg-fumi-50/80 p-8">
            <div className="max-w-lg rounded-[1.35rem] border border-fumi-200 bg-fumi-50 px-7 py-8 text-center shadow-[var(--shadow-app-card)]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-fumi-500">
                    {eyebrow}
                </p>
                {title ? (
                    <h3 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-fumi-900">
                        {title}
                    </h3>
                ) : null}
                <p
                    className={
                        title
                            ? "mt-3 text-sm leading-6 text-fumi-400"
                            : "mt-4 text-sm leading-6 text-fumi-400"
                    }
                >
                    {description}
                </p>
                {action ? (
                    action.shortcut ? (
                        <AppTooltip
                            content={action.label}
                            shortcut={action.shortcut}
                        >
                            <button
                                type="button"
                                onClick={action.onClick}
                                className="app-select-none mt-6 inline-flex h-10 items-center gap-2 rounded-[0.8rem] border border-fumi-200 bg-fumi-600 px-4 text-sm font-semibold tracking-[0.01em] text-white transition-[background-color,border-color,transform] duration-150 ease-out hover:-translate-y-0.5 hover:border-fumi-700 hover:bg-fumi-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-2 focus-visible:ring-offset-fumi-50"
                            >
                                <AppIcon
                                    icon={action.icon}
                                    size={16}
                                    strokeWidth={2.4}
                                />
                                {action.label}
                            </button>
                        </AppTooltip>
                    ) : (
                        <button
                            type="button"
                            onClick={action.onClick}
                            className="app-select-none mt-6 inline-flex h-10 items-center gap-2 rounded-[0.8rem] border border-fumi-200 bg-fumi-600 px-4 text-sm font-semibold tracking-[0.01em] text-white transition-[background-color,border-color,transform] duration-150 ease-out hover:-translate-y-0.5 hover:border-fumi-700 hover:bg-fumi-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-2 focus-visible:ring-offset-fumi-50"
                        >
                            <AppIcon
                                icon={action.icon}
                                size={16}
                                strokeWidth={2.4}
                            />
                            {action.label}
                        </button>
                    )
                ) : null}
            </div>
        </div>
    );
}
