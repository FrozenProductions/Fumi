export type ResolveCommittedTextInputValueOptions = {
    draftValue: string;
    value: string;
    minValue?: number;
    maxValue?: number;
};

export type ResolveCommittedTextInputValueResult = {
    nextDraftValue: string;
    nextValue: string | null;
};

export type GetSteppedTextInputValueOptions = {
    draftValue: string;
    minValue?: number;
    maxValue?: number;
    step: number;
    direction: 1 | -1;
};
