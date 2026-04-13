import type { KeyboardEvent, ReactElement, ReactNode, RefObject } from "react";

export type AppInputSize = "sm" | "md" | "lg";

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

export type AppSearchFieldProps = {
    value: string;
    ariaLabel: string;
    onChange: (value: string) => void;
    placeholder?: string;
    onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
    inputRef?: RefObject<HTMLInputElement | null>;
    isClearable?: boolean;
    clearAriaLabel?: string;
    className?: string;
    inputClassName?: string;
    clearButtonClassName?: string;
};

export type AppSelectOption<TValue extends string> = {
    value: TValue;
    label: string;
};

export type AppSelectProps<TValue extends string> = {
    value: TValue;
    options: readonly AppSelectOption<TValue>[];
    onChange: (value: TValue) => void;
    className?: string;
};

export type AppSettingsToggleProps = {
    label: string;
    description: string;
    isEnabled: boolean;
    onChange: () => void;
    children?: ReactNode;
};
