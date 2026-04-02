import { type ReactElement, useEffect, useState } from "react";

type AppAnimatedTextProps = {
    text: string;
};

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

    return (
        <span
            className="inline-grid overflow-hidden align-top"
            aria-live="polite"
        >
            <span
                key={`${animationKey}-${displayedText}`}
                className="inline-block motion-safe:motion-opacity-in-0 motion-safe:-motion-translate-y-in-[18%] motion-safe:motion-duration-170 motion-safe:motion-ease-out-cubic motion-reduce:animate-none motion-reduce:transform-none"
            >
                {displayedText}
            </span>
        </span>
    );
}
