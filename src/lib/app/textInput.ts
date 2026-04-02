export const APP_TEXT_INPUT_PROPS = {
    autoCapitalize: "off",
    autoComplete: "off",
    autoCorrect: "off",
    spellCheck: false,
} as const;

export function disableTextInputCorrections(
    element: HTMLInputElement | HTMLTextAreaElement,
): void {
    element.setAttribute("autocapitalize", "off");
    element.setAttribute("autocomplete", "off");
    element.setAttribute("autocorrect", "off");
    element.setAttribute("spellcheck", "false");
    element.spellcheck = false;
}

type ResolveCommittedTextInputValueOptions = {
    draftValue: string;
    value: string;
    minValue?: number;
    maxValue?: number;
};

type ResolveCommittedTextInputValueResult = {
    nextDraftValue: string;
    nextValue: string | null;
};

type GetSteppedTextInputValueOptions = {
    draftValue: string;
    minValue?: number;
    maxValue?: number;
    step: number;
    direction: 1 | -1;
};

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
