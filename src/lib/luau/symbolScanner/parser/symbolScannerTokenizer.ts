import type { LuauToken } from "../symbolScanner.type";

function isIdentifierStart(character: string): boolean {
    return /[A-Za-z_]/.test(character);
}

function isIdentifierPart(character: string): boolean {
    return /[A-Za-z0-9_]/.test(character);
}

function isDigit(character: string): boolean {
    return /[0-9]/.test(character);
}

/**
 * Tokenizes Luau source code into identifiers, numbers, symbols, and newlines, skipping comments and strings.
 */
export function tokenizeLuau(content: string): LuauToken[] {
    const tokens: LuauToken[] = [];
    let index = 0;

    while (index < content.length) {
        const character = content[index];
        const nextCharacter = content[index + 1] ?? "";

        if (character === "\r") {
            index += 1;
            continue;
        }

        if (character === "\n") {
            tokens.push({
                type: "newline",
                value: "\n",
                start: index,
                end: index + 1,
            });
            index += 1;
            continue;
        }

        if (/\s/.test(character)) {
            index += 1;
            continue;
        }

        if (character === "-" && nextCharacter === "-") {
            const longCommentMatch = content
                .slice(index + 2)
                .match(/^\[(=*)\[/u);

            if (!longCommentMatch) {
                index += 2;

                while (index < content.length && content[index] !== "\n") {
                    index += 1;
                }

                continue;
            }

            const equals = longCommentMatch[1] ?? "";
            const closeDelimiter = `]${equals}]`;
            index += 2 + longCommentMatch[0].length;

            while (
                index < content.length &&
                !content.startsWith(closeDelimiter, index)
            ) {
                if (content[index] === "\n") {
                    tokens.push({
                        type: "newline",
                        value: "\n",
                        start: index,
                        end: index + 1,
                    });
                }

                index += 1;
            }

            index += closeDelimiter.length;
            continue;
        }

        if (character === "'" || character === '"' || character === "`") {
            const quote = character;
            index += 1;

            while (index < content.length) {
                const currentCharacter = content[index];

                if (currentCharacter === "\\") {
                    index += 2;
                    continue;
                }

                if (currentCharacter === "\n") {
                    tokens.push({
                        type: "newline",
                        value: "\n",
                        start: index,
                        end: index + 1,
                    });
                }

                index += 1;

                if (currentCharacter === quote) {
                    break;
                }
            }

            continue;
        }

        if (character === "[") {
            const longStringMatch = content.slice(index).match(/^\[(=*)\[/u);

            if (longStringMatch) {
                const equals = longStringMatch[1] ?? "";
                const closeDelimiter = `]${equals}]`;
                index += longStringMatch[0].length;

                while (
                    index < content.length &&
                    !content.startsWith(closeDelimiter, index)
                ) {
                    if (content[index] === "\n") {
                        tokens.push({
                            type: "newline",
                            value: "\n",
                            start: index,
                            end: index + 1,
                        });
                    }

                    index += 1;
                }

                index += closeDelimiter.length;
                continue;
            }
        }

        if (content.startsWith("...", index)) {
            tokens.push({
                type: "symbol",
                value: "...",
                start: index,
                end: index + 3,
            });
            index += 3;
            continue;
        }

        if (content.startsWith("::", index)) {
            tokens.push({
                type: "symbol",
                value: "::",
                start: index,
                end: index + 2,
            });
            index += 2;
            continue;
        }

        if (isIdentifierStart(character)) {
            const start = index;
            index += 1;

            while (
                index < content.length &&
                isIdentifierPart(content[index] ?? "")
            ) {
                index += 1;
            }

            tokens.push({
                type: "identifier",
                value: content.slice(start, index),
                start,
                end: index,
            });
            continue;
        }

        if (isDigit(character)) {
            const start = index;
            index += 1;

            while (
                index < content.length &&
                /[0-9A-Fa-f_xXbBeE.]/.test(content[index] ?? "")
            ) {
                index += 1;
            }

            tokens.push({
                type: "number",
                value: content.slice(start, index),
                start,
                end: index,
            });
            continue;
        }

        tokens.push({
            type: "symbol",
            value: character,
            start: index,
            end: index + 1,
        });
        index += 1;
    }

    return tokens;
}
