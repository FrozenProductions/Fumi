import { CURRENT_FILE_DOC_SOURCE } from "../../constants/luau/luau";
import type { PendingLuauFileSymbol, ScopeFrame } from "./symbolScanner.type";

function isStandaloneComment(content: string, commentStart: number): boolean {
    const lineStart = content.lastIndexOf("\n", commentStart - 1) + 1;

    return content.slice(lineStart, commentStart).trim().length === 0;
}

function normalizeOutlineCommentLine(value: string): string {
    return value.replace(/^[\s#*/=-]+/u, "").trim();
}

function getOutlineCommentMetadata(commentBody: string): {
    detail: string;
    label: string;
    summary: string;
} | null {
    const cleanedLines = commentBody
        .split("\n")
        .map((line) => normalizeOutlineCommentLine(line))
        .filter((line) => line.length > 0);

    const summary = cleanedLines.join(" ").trim();

    if (!summary || !/[A-Za-z0-9]/u.test(summary)) {
        return null;
    }

    return {
        detail: commentBody.includes("\n") ? "multiline comment" : "comment",
        label: cleanedLines[0] ?? summary,
        summary,
    };
}

export function extractLuauOutlineComments(
    content: string,
    rootScope: ScopeFrame,
): PendingLuauFileSymbol[] {
    const comments: PendingLuauFileSymbol[] = [];
    let index = 0;

    while (index < content.length) {
        const character = content[index];
        const nextCharacter = content[index + 1] ?? "";

        if (character === "\r" || /\s/.test(character)) {
            index += 1;
            continue;
        }

        if (character === "-" && nextCharacter === "-") {
            const commentStart = index;
            const longCommentMatch = content
                .slice(index + 2)
                .match(/^\[(=*)\[/u);
            const shouldIncludeComment = isStandaloneComment(
                content,
                commentStart,
            );

            if (!longCommentMatch) {
                index += 2;
                const commentBodyStart = index;

                while (index < content.length && content[index] !== "\n") {
                    index += 1;
                }

                if (shouldIncludeComment) {
                    const metadata = getOutlineCommentMetadata(
                        content.slice(commentBodyStart, index),
                    );

                    if (metadata) {
                        comments.push({
                            declarationStart: commentStart,
                            declarationEnd: index,
                            detail: metadata.detail,
                            doc: {
                                source: CURRENT_FILE_DOC_SOURCE,
                                summary: metadata.summary,
                            },
                            isLexical: false,
                            kind: "comment",
                            label: metadata.label,
                            ownerFunction: null,
                            scope: rootScope,
                            visibleStart: commentStart,
                        });
                    }
                }

                continue;
            }

            const equals = longCommentMatch[1] ?? "";
            const closeDelimiter = `]${equals}]`;
            index += 2 + longCommentMatch[0].length;
            const commentBodyStart = index;

            while (
                index < content.length &&
                !content.startsWith(closeDelimiter, index)
            ) {
                index += 1;
            }

            const commentBodyEnd = index;

            if (content.startsWith(closeDelimiter, index)) {
                index += closeDelimiter.length;
            }

            if (shouldIncludeComment) {
                const metadata = getOutlineCommentMetadata(
                    content.slice(commentBodyStart, commentBodyEnd),
                );

                if (metadata) {
                    comments.push({
                        declarationStart: commentStart,
                        declarationEnd: index,
                        detail: metadata.detail,
                        doc: {
                            source: CURRENT_FILE_DOC_SOURCE,
                            summary: metadata.summary,
                        },
                        isLexical: false,
                        kind: "comment",
                        label: metadata.label,
                        ownerFunction: null,
                        scope: rootScope,
                        visibleStart: commentStart,
                    });
                }
            }

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
                    index += 1;
                }

                if (content.startsWith(closeDelimiter, index)) {
                    index += closeDelimiter.length;
                }

                continue;
            }
        }

        index += 1;
    }

    return comments;
}
