import type { AnimatedTitleCharacter } from "./topbar.type";

const TOPBAR_INTERACTIVE_SELECTOR = [
    "button",
    "input",
    "select",
    "textarea",
    "a",
    "[role='button']",
    "[contenteditable='true']",
    "[data-topbar-interactive='true']",
].join(", ");

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

export function isTopbarInteractiveTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
        return false;
    }

    return target.closest(TOPBAR_INTERACTIVE_SELECTOR) !== null;
}
