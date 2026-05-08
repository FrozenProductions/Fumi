import type { ReactElement } from "react";
import { useRef } from "react";
import { CHARACTER_STAGGER_DELAY_MS } from "../../../constants/app/app";
import type {
    AnimatedCharacter,
    AppAnimatedTextProps,
} from "./AppAnimatedText.type";

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
    const initialTextRef = useRef(text);
    const characters = splitTextIntoCharacters(text);
    const shouldAnimateCharacters =
        animateOnInitialRender || text !== initialTextRef.current;
    const characterClassName = shouldAnimateCharacters
        ? "inline-block whitespace-pre motion-safe:motion-opacity-in-0 motion-safe:-motion-translate-y-in-[18%] motion-safe:motion-duration-130 motion-safe:motion-ease-out-cubic motion-reduce:animate-none motion-reduce:transform-none"
        : "inline-block whitespace-pre";

    return (
        <span
            className="inline-grid overflow-hidden align-top"
            aria-live="polite"
        >
            <span key={text} className="inline-block whitespace-pre-wrap">
                <span className="sr-only">{text}</span>
                {characters.map(({ character, delayMs, key }) => {
                    const characterStyle = {
                        animationDelay: `${delayMs}ms`,
                    };

                    return (
                        <span
                            key={key}
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
