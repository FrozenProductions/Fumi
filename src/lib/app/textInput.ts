import type {
    GetSteppedTextInputValueOptions,
    ResolveCommittedTextInputValueOptions,
    ResolveCommittedTextInputValueResult,
} from "./textInput.type";

/**
 * Disables browser autocorrect, autocomplete, autocapitalize, and spellcheck on a text input.
 */
export function disableTextInputCorrections(
    element: HTMLInputElement | HTMLTextAreaElement,
): void {
    element.setAttribute("autocapitalize", "off");
    element.setAttribute("autocomplete", "off");
    element.setAttribute("autocorrect", "off");
    element.setAttribute("spellcheck", "false");
    element.spellcheck = false;
}

/**
 * Parses and clamps a numeric text input value to the specified range.
 *
 * @returns The clamped value as a string, or null if the input is not a valid number.
 */
export function clampNumericTextInputValue(
    rawValue: string,
    minValue?: number,
    maxValue?: number,
): string | null {
    const parsedValue = Number(rawValue);

    if (Number.isNaN(parsedValue)) {
        return null;
    }

    let nextValue = parsedValue;

    if (minValue !== undefined) {
        nextValue = Math.max(minValue, nextValue);
    }

    if (maxValue !== undefined) {
        nextValue = Math.min(maxValue, nextValue);
    }

    return String(nextValue);
}

/**
 * Resolves a committed text input value from draft, applying min/max constraints.
 *
 * @remarks
 * Returns the current stored value if the draft is empty, otherwise returns
 * the trimmed value clamped to the valid range.
 */
export function resolveCommittedTextInputValue({
    draftValue,
    value,
    minValue,
    maxValue,
}: ResolveCommittedTextInputValueOptions): ResolveCommittedTextInputValueResult {
    const trimmedValue = draftValue.trim();

    if (trimmedValue.length === 0) {
        return {
            nextDraftValue: value,
            nextValue: null,
        };
    }

    if (minValue === undefined && maxValue === undefined) {
        return {
            nextDraftValue: trimmedValue,
            nextValue: trimmedValue,
        };
    }

    const nextValue = clampNumericTextInputValue(
        trimmedValue,
        minValue,
        maxValue,
    );

    if (nextValue === null) {
        return {
            nextDraftValue: value,
            nextValue: null,
        };
    }

    return {
        nextDraftValue: nextValue,
        nextValue,
    };
}

/**
 * Steps a numeric input value up or down by a specified amount.
 *
 * @remarks
 * Uses 0 as the current value if the draft is non-numeric.
 */
export function getSteppedTextInputValue({
    draftValue,
    minValue,
    maxValue,
    step,
    direction,
}: GetSteppedTextInputValueOptions): string | null {
    const currentValue = Number(draftValue) || 0;

    return clampNumericTextInputValue(
        String(currentValue + step * direction),
        minValue,
        maxValue,
    );
}
