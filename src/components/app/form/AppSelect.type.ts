export type AppSelectOption<TValue extends string | number> = {
    value: TValue;
    label: string;
};

export type AppSelectProps<TValue extends string | number> = {
    value: TValue;
    options: readonly AppSelectOption<TValue>[];
    onChange: (value: TValue) => void;
    className?: string;
};
