import { forwardRef } from "react";
import type { AppIconButtonProps } from "./appVisual.type";

/**
 * A styled icon button with active state styling.
 *
 * @param props - Component props
 * @param props.ariaLabel - Accessible label for the button
 * @param props.isActive - Whether the button is in active state
 * @returns A styled button element
 */
export const AppIconButton = forwardRef<HTMLButtonElement, AppIconButtonProps>(
    function AppIconButton(
        {
            ariaLabel,
            children,
            className,
            isActive = false,
            type = "button",
            ...buttonProps
        },
        ref,
    ) {
        const buttonClassName = [
            "app-select-none relative z-[1] inline-flex h-8 w-8 items-center justify-center rounded-[0.65rem] p-0 transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-2 focus-visible:ring-offset-fumi-100",
            isActive
                ? "bg-fumi-50 text-fumi-600 shadow-sm ring-1 ring-fumi-200"
                : "text-fumi-400 hover:bg-fumi-200 hover:text-fumi-600",
            className,
        ]
            .filter(Boolean)
            .join(" ");

        return (
            <button
                {...buttonProps}
                ref={ref}
                type={type}
                className={buttonClassName}
                aria-label={ariaLabel}
                aria-pressed={isActive}
            >
                {children}
            </button>
        );
    },
);
