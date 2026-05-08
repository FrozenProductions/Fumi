import type { KeyboardEvent, RefObject } from "react";

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
