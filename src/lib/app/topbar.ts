import { TOPBAR_INTERACTIVE_SELECTOR } from "../../constants/app/topbar";
import type { AnimatedTitleCharacter } from "./topbar.type";

/**
 * Formats a workspace path for display, collapsing home directories to ~.
 */
export function formatWorkspaceTooltipPath(
    workspacePath: string | null | undefined,
): string {
    if (!workspacePath) {
        return "Open a workspace";
    }

    return workspacePath
        .replace(/^\/Users\/[^/]+/, "~")
        .replace(/^\/home\/[^/]+/, "~");
}

/**
 * Builds an array of animated title characters with computed horizontal offsets and deduplicated keys.
 */
export function getAnimatedTitleCharacters(
    title: string,
): AnimatedTitleCharacter[] {
    return Array.from(title).map((char, index, chars) => {
        const duplicateIndex = chars
            .slice(0, index)
            .filter((existingChar) => existingChar === char).length;
        const mid = (title.length - 1) / 2;

        return {
            char,
            key: `${char}-${duplicateIndex}`,
            offsetX: (index - mid) * 4.25,
        };
    });
}

/**
 * Returns whether the event target is an interactive element within the topbar.
 */
export function isTopbarInteractiveTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
        return false;
    }

    return target.closest(TOPBAR_INTERACTIVE_SELECTOR) !== null;
}
