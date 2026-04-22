import {
    FAILED_TO_CHECK_PHRASES,
    UP_TO_DATE_PHRASES,
    UPDATE_AVAILABLE_PHRASES,
} from "../../../constants/app/app";
import type { AppUpdaterStatus } from "../app.type";

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

export function shouldRefreshAppUpdaterPhrase(
    status: AppUpdaterStatus,
): boolean {
    return (
        status === "available" || status === "upToDate" || status === "error"
    );
}
