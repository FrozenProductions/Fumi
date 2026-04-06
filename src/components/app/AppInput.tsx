import type {
    ChangeEvent,
    FocusEvent,
    KeyboardEvent,
    MouseEvent,
    ReactElement,
} from "react";
import { useEffect, useState } from "react";
import {
    APP_INPUT_SIZE_MIN_WIDTH_MAP,
    APP_TEXT_INPUT_PROPS,
} from "../../constants/app/input";
import {
    getSteppedTextInputValue,
    resolveCommittedTextInputValue,
} from "../../lib/app/textInput";
import type { AppInputProps } from "./appForm.type";

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
    const [draftValue, setDraftValue] = useState(value);

    useEffect(() => {
        setDraftValue(value);
    }, [value]);

    const commitValue = (): void => {
        const { nextDraftValue, nextValue } = resolveCommittedTextInputValue({
            draftValue,
            value,
            minValue,
            maxValue,
        });

        setDraftValue(nextDraftValue);

        if (nextValue !== null && nextValue !== value) {
            onChange(nextValue);
        }
    };

    const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
        setDraftValue(event.target.value);
    };

    const handleFocus = (event: FocusEvent<HTMLInputElement>): void => {
        event.currentTarget.select();
    };

    const handleClick = (event: MouseEvent<HTMLInputElement>): void => {
        event.currentTarget.select();
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
        if (event.key === "Enter") {
            commitValue();
            event.currentTarget.blur();
            return;
        }

        if (event.key === "Escape") {
            setDraftValue(value);
            event.currentTarget.blur();
            return;
        }

        if (
            step !== undefined &&
            (event.key === "ArrowUp" || event.key === "ArrowDown")
        ) {
            event.preventDefault();
            const next = getSteppedTextInputValue({
                draftValue,
                minValue,
                maxValue,
                step,
                direction: event.key === "ArrowUp" ? 1 : -1,
            });

            if (next !== null) {
                setDraftValue(next);
                onChange(next);
            }
        }
    };

    const sizeClass = size ? APP_INPUT_SIZE_MIN_WIDTH_MAP[size] : "min-w-[1ch]";
    const measuredValue = draftValue || placeholder || value || " ";

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
                    value={draftValue}
                    aria-label={ariaLabel}
                    inputMode={inputMode}
                    maxLength={maxLength}
                    placeholder={placeholder}
                    readOnly={isReadOnly}
                    onChange={handleChange}
                    onBlur={commitValue}
                    onFocus={handleFocus}
                    onClick={handleClick}
                    onKeyDown={handleKeyDown}
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
