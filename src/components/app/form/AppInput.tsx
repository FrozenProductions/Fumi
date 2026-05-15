import type { ReactElement } from "react";
import {
    APP_INPUT_SIZE_MIN_WIDTH_MAP,
    APP_TEXT_INPUT_PROPS,
} from "../../../constants/app/input";
import { useAppInputController } from "../../../hooks/app/useAppInputController";
import type { AppInputProps } from "./AppInput.type";

/**
 * A styled text input with optional step controls and prefix/suffix support.
 *
 * @param props - Component props
 * @param props.value - Controlled input value
 * @param props.ariaLabel - Accessible label
 * @param props.onChange - Called when value changes
 * @param props.minValue - Minimum value for step controls
 * @param props.maxValue - Maximum value for step controls
 * @param props.maxLength - Maximum character length
 * @param props.inputMode - HTML input mode hint
 * @param props.suffix - Unit label displayed after input
 * @param props.prefix - Label displayed before input
 * @param props.placeholder - Placeholder text
 * @param props.isReadOnly - Prevent editing
 * @param props.step - Step increment for arrow keys
 * @param props.size - Predefined size variant
 * @returns A React component
 */
export function AppInput({
    value,
    ariaLabel,
    onChange,
    minValue,
    maxValue,
    maxLength,
    inputMode = "text",
    suffix,
    prefix,
    placeholder,
    isReadOnly = false,
    step,
    size,
    className = "",
}: AppInputProps): ReactElement {
    const inputController = useAppInputController({
        maxValue,
        minValue,
        onChange,
        step,
        value,
    });

    const sizeClass = size ? APP_INPUT_SIZE_MIN_WIDTH_MAP[size] : "min-w-[1ch]";
    const measuredValue =
        inputController.displayedValue || placeholder || value || " ";

    return (
        <label
            className={`inline-flex h-8 w-fit items-center gap-1.5 rounded-[0.65rem] border border-fumi-200 bg-fumi-50 px-2.5 text-xs font-semibold text-fumi-800 transition-[border-color,box-shadow] ${
                isReadOnly
                    ? "cursor-default opacity-60"
                    : "hover:border-fumi-300 focus-within:border-fumi-300 focus-within:ring-1 focus-within:ring-fumi-200"
            } ${className}`}
        >
            {prefix ?? null}
            <div className={`relative inline-grid ${sizeClass}`}>
                <span className="invisible min-w-[1ch] whitespace-pre px-px text-right text-xs font-semibold">
                    {measuredValue}
                </span>
                <input
                    type="text"
                    value={inputController.displayedValue}
                    aria-label={ariaLabel}
                    inputMode={inputMode}
                    maxLength={maxLength}
                    placeholder={placeholder}
                    readOnly={isReadOnly}
                    onChange={inputController.handleChange}
                    onBlur={(event) => {
                        inputController.commitValue(event.currentTarget.value);
                    }}
                    onFocus={inputController.handleFocus}
                    onClick={inputController.handleClick}
                    onKeyDown={inputController.handleKeyDown}
                    {...APP_TEXT_INPUT_PROPS}
                    className="absolute inset-0 w-full min-w-0 border-none bg-transparent px-px text-right text-xs font-semibold text-fumi-800 outline-none placeholder:text-fumi-400"
                />
            </div>
            {suffix ? (
                <span className="shrink-0 text-[11px] font-semibold text-fumi-400">
                    {suffix}
                </span>
            ) : null}
        </label>
    );
}
