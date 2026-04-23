import type { FocusEvent } from "react";
import { useState } from "react";

type UseAccountRevealResult = {
    revealedAccountId: string | null;
    revealAccount: (accountId: string) => void;
    hideAccount: (
        accountId: string,
        currentTarget: HTMLDivElement,
        relatedTarget?: EventTarget | null,
    ) => void;
    handleAccountRowBlur: (
        event: FocusEvent<HTMLDivElement>,
        accountId: string,
    ) => void;
};

/**
 * Tracks which streamer-masked account row is temporarily revealed.
 *
 * @returns Object containing the revealed account ID, reveal/hide actions, and blur handler
 */
export function useAccountReveal(): UseAccountRevealResult {
    const [revealedAccountId, setRevealedAccountId] = useState<string | null>(
        null,
    );

    const revealAccount = (accountId: string): void => {
        setRevealedAccountId(accountId);
    };

    const hideAccount = (
        accountId: string,
        currentTarget: HTMLDivElement,
        relatedTarget: EventTarget | null = null,
    ): void => {
        if (
            relatedTarget instanceof Node &&
            currentTarget.contains(relatedTarget)
        ) {
            return;
        }

        if (currentTarget.contains(document.activeElement)) {
            return;
        }

        if (currentTarget.matches(":hover")) {
            return;
        }

        setRevealedAccountId((currentAccountId) =>
            currentAccountId === accountId ? null : currentAccountId,
        );
    };

    const handleAccountRowBlur = (
        event: FocusEvent<HTMLDivElement>,
        accountId: string,
    ): void => {
        hideAccount(accountId, event.currentTarget, event.relatedTarget);
    };

    return {
        revealedAccountId,
        revealAccount,
        hideAccount,
        handleAccountRowBlur,
    };
}
