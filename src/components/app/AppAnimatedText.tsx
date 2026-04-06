import { type ReactElement, useEffect, useState } from "react";
import type { AnimatedCharacter, AppAnimatedTextProps } from "./appVisual.type";

const CHARACTER_STAGGER_DELAY_MS = 12;

function splitTextIntoCharacters(text: string): AnimatedCharacter[] {
    const occurrenceCountByCharacter = new Map<string, number>();

    return Array.from(text).map((character, position) => {
        const nextOccurrence =
            (occurrenceCountByCharacter.get(character) ?? 0) + 1;

        occurrenceCountByCharacter.set(character, nextOccurrence);

        return {
            character,
            delayMs: position * CHARACTER_STAGGER_DELAY_MS,
            key: `${character}-${nextOccurrence}`,
        };
    });
}

export function AppAnimatedText({ text }: AppAnimatedTextProps): ReactElement {
    const [displayedText, setDisplayedText] = useState(text);
    const [animationKey, setAnimationKey] = useState(0);

    useEffect(() => {
        if (text === displayedText) {
            return;
        }

        setDisplayedText(text);
        setAnimationKey((currentKey) => currentKey + 1);
    }, [displayedText, text]);

    const characters = splitTextIntoCharacters(displayedText);

    return (
        <span
            className="inline-grid overflow-hidden align-top"
            aria-live="polite"
        >
            <span
                key={`${animationKey}-${displayedText}`}
                className="inline-block whitespace-pre-wrap"
            >
                <span className="sr-only">{displayedText}</span>
                {characters.map(({ character, delayMs, key }) => (
                    <span
                        key={`${animationKey}-${key}`}
                        aria-hidden="true"
                        className="inline-block whitespace-pre motion-safe:motion-opacity-in-0 motion-safe:-motion-translate-y-in-[18%] motion-safe:motion-duration-130 motion-safe:motion-ease-out-cubic motion-reduce:animate-none motion-reduce:transform-none"
                        style={{
                            animationDelay: `${delayMs}ms`,
                        }}
                    >
                        {character}
                    </span>
                ))}
            </span>
        </span>
    );
}
