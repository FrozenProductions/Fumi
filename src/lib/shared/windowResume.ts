const WINDOW_RESUME_DEBOUNCE_MS = 100;
const WINDOW_RESUME_COOLDOWN_MS = 250;

const resumeListeners = new Set<() => void>();

let resumeCleanup: (() => void) | null = null;
let resumeTimeoutId: number | null = null;
let lastResumeNotificationAt = 0;

function clearResumeTimeout(): void {
    if (resumeTimeoutId === null) {
        return;
    }

    window.clearTimeout(resumeTimeoutId);
    resumeTimeoutId = null;
}

function notifyResumeListeners(): void {
    const now = Date.now();

    if (now - lastResumeNotificationAt < WINDOW_RESUME_COOLDOWN_MS) {
        return;
    }

    lastResumeNotificationAt = now;

    for (const listener of resumeListeners) {
        listener();
    }
}

function scheduleResumeListeners(): void {
    clearResumeTimeout();
    resumeTimeoutId = window.setTimeout(() => {
        resumeTimeoutId = null;
        notifyResumeListeners();
    }, WINDOW_RESUME_DEBOUNCE_MS);
}

function handleWindowResume(): void {
    scheduleResumeListeners();
}

function handleVisibilityResume(): void {
    if (document.visibilityState !== "visible") {
        return;
    }

    scheduleResumeListeners();
}

function ensureWindowResumeSubscription(): void {
    if (resumeCleanup || resumeListeners.size === 0) {
        return;
    }

    window.addEventListener("focus", handleWindowResume);
    document.addEventListener("visibilitychange", handleVisibilityResume);

    resumeCleanup = () => {
        window.removeEventListener("focus", handleWindowResume);
        document.removeEventListener(
            "visibilitychange",
            handleVisibilityResume,
        );
        clearResumeTimeout();
        resumeCleanup = null;
    };
}

function cleanupWindowResumeSubscription(): void {
    if (resumeListeners.size > 0) {
        return;
    }

    resumeCleanup?.();
}

export function subscribeToWindowResume(listener: () => void): () => void {
    resumeListeners.add(listener);
    ensureWindowResumeSubscription();

    return () => {
        resumeListeners.delete(listener);
        cleanupWindowResumeSubscription();
    };
}
