import type { ReactElement } from "react";

type AppInputSize = "sm" | "md" | "lg";

export type AppInputProps = {
    value: string;
    ariaLabel: string;
    onChange: (value: string) => void;
    minValue?: number;
    maxValue?: number;
    maxLength?: number;
    inputMode?:
        | "text"
        | "numeric"
        | "decimal"
        | "search"
        | "email"
        | "url"
        | "tel";
    suffix?: string;
    prefix?: ReactElement;
    placeholder?: string;
    isReadOnly?: boolean;
    step?: number;
    size?: AppInputSize;
    className?: string;
};
