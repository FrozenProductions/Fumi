import type { ChangeEvent, FocusEvent, KeyboardEvent, MouseEvent } from "react";
import { useRef, useState } from "react";
import type { AppInputProps } from "../../components/app/form/AppInput.type";
import {
    getSteppedTextInputValue,
    resolveCommittedTextInputValue,
} from "../../lib/app/textInput";

type UseAppInputControllerOptions = Pick<
    AppInputProps,
    "maxValue" | "minValue" | "onChange" | "step" | "value"
>;

type UseAppInputControllerResult = {
    displayedValue: string;
    commitValue: (currentDraftValue?: string) => void;
    handleClick: (event: MouseEvent<HTMLInputElement>) => void;
    handleChange: (event: ChangeEvent<HTMLInputElement>) => void;
    handleFocus: (event: FocusEvent<HTMLInputElement>) => void;
    handleKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
};

/**
 * Manages text input state for numeric/text fields with validation and stepping.
 *
 * Handles draft value editing, commit on Enter/blur, cancel on Escape, and
 * arrow key stepping. Validates against min/max bounds and formats the
 * displayed value based on editing state.
 *
 * @param options - Configuration for the input controller
 * @param options.maxValue - Maximum allowed value
 * @param options.minValue - Minimum allowed value
 * @param options.onChange - Called when the value commits
 * @param options.step - Step increment for arrow keys
 * @param options.value - Current committed value
 * @returns Displayed value and event handlers
 */
export function useAppInputController({
    maxValue,
    minValue,
    onChange,
    step,
    value,
}: UseAppInputControllerOptions): UseAppInputControllerResult {
    const [draftValue, setDraftValue] = useState(value);
    const [isEditing, setIsEditing] = useState(false);
    const displayedValue = isEditing ? draftValue : value;
    const latestDisplayedValueRef = useRef(displayedValue);

    latestDisplayedValueRef.current = displayedValue;

    function commitValue(
        currentDraftValue = latestDisplayedValueRef.current,
    ): void {
        const resolvedValue = resolveCommittedTextInputValue({
            draftValue: currentDraftValue,
            value,
            minValue,
            maxValue,
        });

        setDraftValue(resolvedValue.nextDraftValue);
        setIsEditing(false);

        if (
            resolvedValue.nextValue !== null &&
            resolvedValue.nextValue !== value
        ) {
            onChange(resolvedValue.nextValue);
        }
    }

    function handleChange(event: ChangeEvent<HTMLInputElement>): void {
        setIsEditing(true);
        setDraftValue(event.target.value);
    }

    function handleFocus(event: FocusEvent<HTMLInputElement>): void {
        setDraftValue(value);
        setIsEditing(true);
        event.currentTarget.select();
    }

    function handleClick(event: MouseEvent<HTMLInputElement>): void {
        event.currentTarget.select();
    }

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
        if (event.key === "Enter") {
            commitValue(event.currentTarget.value);
            event.currentTarget.blur();
            return;
        }

        if (event.key === "Escape") {
            setDraftValue(value);
            setIsEditing(false);
            latestDisplayedValueRef.current = value;
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
                setIsEditing(true);
                setDraftValue(next);
                latestDisplayedValueRef.current = next;
                onChange(next);
            }
        }
    }

    return {
        displayedValue,
        commitValue,
        handleClick,
        handleChange,
        handleFocus,
        handleKeyDown,
    };
}
