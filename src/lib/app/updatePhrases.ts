import type { AppUpdaterStatus } from "../../lib/app/app.type";

const UP_TO_DATE_PHRASES = [
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

const UPDATE_AVAILABLE_PHRASES = [
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

const FAILED_TO_CHECK_PHRASES = [
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
