import { Cancel01Icon } from "@hugeicons/core-free-icons";
import type { ChangeEvent, ReactElement } from "react";
import { APP_TEXT_INPUT_PROPS } from "../../../constants/app/input";
import { AppIcon } from "../common/AppIcon";
import type { AppSearchFieldProps } from "./appForm.type";

/**
 * A search input field with optional clear button support.
 *
 * @param props - Component props
 * @param props.value - Current input value
 * @param props.ariaLabel - Accessible label
 * @param props.onChange - Called when input changes
 * @param props.placeholder - Placeholder text
 * @param props.isClearable - Show clear button when has value
 * @returns A React component
 */
export function AppSearchField({
    value,
    ariaLabel,
    onChange,
    placeholder,
    onKeyDown,
    inputRef,
    isClearable = false,
    clearAriaLabel = "Clear search",
    className = "",
    inputClassName = "",
    clearButtonClassName = "",
}: AppSearchFieldProps): ReactElement {
    const shouldShowClearButton = isClearable && value.trim().length > 0;

    const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
        onChange(event.target.value);
    };

    const handleClear = (): void => {
        onChange("");
        inputRef?.current?.focus();
    };

    return (
        <div className={`relative min-w-0 ${className}`}>
            <input
                ref={inputRef}
                type="text"
                value={value}
                placeholder={placeholder}
                aria-label={ariaLabel}
                onChange={handleChange}
                onKeyDown={onKeyDown}
                {...APP_TEXT_INPUT_PROPS}
                style={
                    shouldShowClearButton
                        ? { paddingRight: "1.75rem" }
                        : undefined
                }
                className={inputClassName}
            />
            {shouldShowClearButton ? (
                <button
                    type="button"
                    aria-label={clearAriaLabel}
                    onClick={handleClear}
                    className={clearButtonClassName}
                >
                    <AppIcon icon={Cancel01Icon} size={12} strokeWidth={2.5} />
                </button>
            ) : null}
        </div>
    );
}
