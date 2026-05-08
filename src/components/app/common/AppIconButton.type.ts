import type { ButtonHTMLAttributes, ReactNode } from "react";

export type AppIconButtonProps = Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "aria-label" | "children"
> & {
    ariaLabel: string;
    children: ReactNode;
    isActive?: boolean;
};
