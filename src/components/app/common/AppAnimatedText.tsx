import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { CHARACTER_STAGGER_DELAY_MS } from "../../../constants/app/app";
import type { AnimatedCharacter, AppAnimatedTextProps } from "./appVisual.type";

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

/**
 * Animated text that reveals characters with a staggered entrance effect.
 *
 * @param props - Component props
 * @param props.text - The text to display
 * @param props.animateOnInitialRender - Animate on first render
 * @returns A React component
 */
export function AppAnimatedText({
    text,
    animateOnInitialRender = true,
}: AppAnimatedTextProps): ReactElement {
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
    const shouldAnimateCharacters = animateOnInitialRender || animationKey > 0;
    const characterClassName = shouldAnimateCharacters
        ? "inline-block whitespace-pre motion-safe:motion-opacity-in-0 motion-safe:-motion-translate-y-in-[18%] motion-safe:motion-duration-130 motion-safe:motion-ease-out-cubic motion-reduce:animate-none motion-reduce:transform-none"
        : "inline-block whitespace-pre";

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
                {characters.map(({ character, delayMs, key }) => {
                    const characterStyle = {
                        animationDelay: `${delayMs}ms`,
                    };

                    return (
                        <span
                            key={`${animationKey}-${key}`}
                            aria-hidden="true"
                            className={characterClassName}
                            style={characterStyle}
                        >
                            {character}
                        </span>
                    );
                })}
            </span>
        </span>
    );
}
