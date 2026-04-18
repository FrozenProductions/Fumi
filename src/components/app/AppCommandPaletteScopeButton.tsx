import type { ReactElement } from "react";
import { AppIcon } from "./AppIcon";
import { AppTooltip } from "./AppTooltip";
import type { AppCommandPaletteScopeButtonProps } from "./appShell.type";

/**
 * A scope selector button for the command palette.
 *
 * @param props - Component props
 * @param props.ariaLabel - Accessible label
 * @param props.content - Tooltip content
 * @param props.shortcut - Keyboard shortcut hint
 * @param props.icon - Icon to display
 * @param props.isPressed - Whether the scope is active
 * @param props.onClick - Called when clicked
 * @returns A React component
 */
export function AppCommandPaletteScopeButton({
    ariaLabel,
    content,
    shortcut,
    icon,
    isPressed,
    onClick,
}: AppCommandPaletteScopeButtonProps): ReactElement {
    return (
        <AppTooltip content={content} shortcut={shortcut} side="bottom">
            <button
                type="button"
                aria-label={ariaLabel}
                aria-pressed={isPressed}
                onClick={onClick}
                className={[
                    "app-select-none inline-flex size-9 items-center justify-center rounded-full border shadow-[var(--shadow-app-floating)] transition-[background-color,border-color,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-2 focus-visible:ring-offset-fumi-50",
                    isPressed
                        ? "border-fumi-300 bg-fumi-600 text-fumi-50"
                        : "border-fumi-200 bg-fumi-50 text-fumi-500 hover:border-fumi-300 hover:bg-fumi-100 hover:text-fumi-700",
                ].join(" ")}
            >
                <AppIcon icon={icon} size={13} strokeWidth={2.5} />
            </button>
        </AppTooltip>
    );
}
