import {
    FAILED_TO_CHECK_PHRASES,
    UP_TO_DATE_PHRASES,
    UPDATE_AVAILABLE_PHRASES,
} from "../../constants/app/updater";
import type { AppUpdaterStatus } from "./updater.type";

function pickRandomPhrase(
    phrases: readonly string[],
    previousPhrase?: string,
): string {
    const availablePhrases = previousPhrase
        ? phrases.filter((phrase) => phrase !== previousPhrase)
        : [...phrases];
    const phrasePool = availablePhrases.length > 0 ? availablePhrases : phrases;
    const randomIndex = Math.floor(Math.random() * phrasePool.length);

    return phrasePool[randomIndex] ?? phrasePool[0] ?? "";
}

/**
 * Returns a random updater phrase appropriate for the current status, avoiding repetition.
 */
export function getAppUpdaterPhrase(
    status: AppUpdaterStatus,
    previousPhrase?: string,
): string {
    if (
        status === "available" ||
        status === "downloading" ||
        status === "installing" ||
        status === "readyToRestart"
    ) {
        return pickRandomPhrase(UPDATE_AVAILABLE_PHRASES, previousPhrase);
    }

    if (status === "error") {
        return pickRandomPhrase(FAILED_TO_CHECK_PHRASES, previousPhrase);
    }

    return pickRandomPhrase(UP_TO_DATE_PHRASES, previousPhrase);
}

/**
 * Returns whether the updater phrase should be refreshed for the given status transition.
 */
export function shouldRefreshAppUpdaterPhrase(
    status: AppUpdaterStatus,
): boolean {
    return (
        status === "available" || status === "upToDate" || status === "error"
    );
}
