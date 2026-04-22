import type { HotkeysProviderOptions } from "@tanstack/react-hotkeys";
import type { CSSProperties } from "react";
import type { TrafficLightTone } from "../../components/app/common/appVisual.type";

export const APP_TITLE = "Fumi";
export const APP_VERSION = __APP_VERSION__;
export const APP_DESCRIPTION =
    "Elegant and soft UI wrapper for MacSploit and Opiumware.";
export const APP_AUTHOR_NAME = "FrozenProductions";
export const APP_AUTHOR_URL = "https://github.com/FrozenProductions/";
export const APP_THEMES = ["system", "light", "dark"] as const;
export const APP_INTELLISENSE_WIDTHS = ["small", "normal", "large"] as const;
export const APP_MIDDLE_CLICK_TAB_ACTIONS = ["archive", "delete"] as const;
export const APP_SIDEBAR_POSITIONS = ["left", "right"] as const;
export const APP_THEME_TRANSITION_GUARD_ID = "app-theme-transition-guard";
export const CHARACTER_STAGGER_DELAY_MS = 12;
export const HOTKEY_KEY_CODE_MAP = {
    "`": "Backquote",
    "-": "Minus",
    "=": "Equal",
    "[": "BracketLeft",
    "]": "BracketRight",
    "\\": "Backslash",
    ";": "Semicolon",
    "'": "Quote",
    ",": "Comma",
    ".": "Period",
    "/": "Slash",
} as const satisfies Record<string, string>;
export const HOTKEY_PROVIDER_DEFAULT_OPTIONS: HotkeysProviderOptions = {
    hotkey: {
        preventDefault: true,
        stopPropagation: true,
        conflictBehavior: "warn",
    },
};
export const STARTUP_ERROR_BACKGROUND = "rgb(244 243 238)";
export const STARTUP_ERROR_BORDER = "rgb(221 219 212)";
export const STARTUP_ERROR_TEXT = "rgb(44 43 40)";
export const STARTUP_ERROR_ACCENT = "rgb(193 95 60)";
export const TOPBAR_INTERACTIVE_SELECTOR = [
    "button",
    "input",
    "select",
    "textarea",
    "a",
    "[role='button']",
    "[contenteditable='true']",
    "[data-topbar-interactive='true']",
].join(", ");
export const TRAFFIC_LIGHT_STYLE_MAP: Record<TrafficLightTone, CSSProperties> =
    {
        close: {
            backgroundColor: "rgb(var(--color-traffic-close) / 1)",
        },
        minimize: {
            backgroundColor: "rgb(var(--color-traffic-minimize) / 1)",
        },
        maximize: {
            backgroundColor: "rgb(var(--color-traffic-maximize) / 1)",
        },
    };
export const UP_TO_DATE_PHRASES = [
    "Already current. No dramatic reveal today",
    "You're on the latest build. Try causing new problems",
    "All quiet on the update front",
    "No update. Only vibes",
    "Fresh enough already",
    "Nothing new. Suspicious, honestly",
    "You're already holding the good version",
    "No patch notes, no panic",
    "Still the latest. We checked",
    "Current status: pleasantly uneventful",
] as const;
export const UPDATE_AVAILABLE_PHRASES = [
    "Fresh meat has arrived",
    "The new hotness is here",
    "Plot twist: Fumi actually updated!",
    "It's alive!",
    "The prophecy has been fulfilled",
    "Your moment has come",
    "Alert: improvement detected",
    "Something good is happening",
    "Plot twist: it works now",
    "The future is now, old man",
    "Behold: progress",
    "Your patience has been rewarded",
    "The chosen one has arrived",
    "Rejoice! The moment of glory is upon us",
    "Status: ACTUALLY FINISHED",
    "Breaking: we shipped it",
    "The upgrade awakens",
    "New features, who dis?",
    "Prepare yourself for excellence",
    "The wait is over (finally)",
    "Greatness has entered the chat",
    "The prophecy was real",
    "Changelog: everything and nothing",
    "Reality: better than before",
    "The stars have aligned",
    "Destiny calls, and it has bug fixes",
    "From the ashes, rebirth",
    "The update chose you",
    "Blessed by the code gods",
    "Version bump: the reckoning",
] as const;
export const FAILED_TO_CHECK_PHRASES = [
    "Something went very wrong...",
    "We tried to check, the internet said no",
    "Connection? I barely know 'er",
    "Houston, we have a problem",
    "The server is taking a nap",
    "Network? Never heard of her",
    "Oops, we broke something",
    "Well, that didn't work (shocking, we know)",
    "The hamster died, please restart",
    "Connection ghosted us",
    "The WiFi gods have spoken: no",
    "Bits got lost in the mail",
    "Reality.exe has stopped responding",
    "We're in the upside down",
    "The internet is currently unavailable (shocking)",
    "Connection timeout: existential crisis",
    "The cables are tired",
    "Your request has been yeeted into the void",
    "Signal lost in the noise",
    "The matrix has you",
    "Firewall said 'nope'",
    "Packet loss: spiritual and literal",
    "The cloud ran away",
    "Internet explorer: still loading",
    "Carrier pigeons are on strike",
    "The server said 'not today'",
    "Connection refused by destiny",
    "Reality check: failed",
    "The universe returned an error",
    "We forgot to pay the internet bill",
    "The check failed harder than our deployment",
] as const;
