export type UsePresenceTransitionOptions = {
    isOpen: boolean;
    exitDurationMs: number;
};

export type UsePresenceTransitionResult = {
    isPresent: boolean;
    isClosing: boolean;
};
