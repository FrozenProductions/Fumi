import spinnerIcon from "../../assets/icons/spinner.svg";

export const SCRIPT_LIBRARY_SPINNER_MASK_STYLE = {
    mask: `url("${spinnerIcon}") center / contain no-repeat`,
    WebkitMask: `url("${spinnerIcon}") center / contain no-repeat`,
} as const;
