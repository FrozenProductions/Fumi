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
