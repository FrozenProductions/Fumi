export const APP_INPUT_SIZE_MIN_WIDTH_MAP = {
    sm: "min-w-[2ch]",
    md: "min-w-[4ch]",
    lg: "min-w-[8ch]",
} as const;

export const APP_TEXT_INPUT_PROPS = {
    autoCapitalize: "off",
    autoComplete: "off",
    autoCorrect: "off",
    spellCheck: false,
} as const;

export type AppInputSize = keyof typeof APP_INPUT_SIZE_MIN_WIDTH_MAP;
