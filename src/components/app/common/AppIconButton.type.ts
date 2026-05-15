import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";

export type AppIconButtonProps = Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "aria-label" | "children"
> & {
    ariaLabel: string;
    children: ReactNode;
    isActive?: boolean;
    ref?: Ref<HTMLButtonElement>;
};
