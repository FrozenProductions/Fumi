import type { WorkspaceCursorState } from "../../lib/workspace/workspace.type";
import { clamp } from "../shared/math";

/**
 * Clamps a cursor position to valid coordinates within the given content.
 *
 * @remarks
 * Ensures line and column are within bounds and scrollTop is non-negative.
 */
export function clampCursorToContent(
    content: string,
    cursor: WorkspaceCursorState,
): WorkspaceCursorState {
    const { line: clampedLine, lineLength } = getClampedCursorLine(
        content,
        cursor,
    );

    return {
        line: clampedLine,
        column: clamp(cursor.column, 0, lineLength),
        scrollTop: Math.max(cursor.scrollTop, 0),
    };
}

function getClampedCursorLine(
    content: string,
    cursor: WorkspaceCursorState,
): {
    line: number;
    lineLength: number;
} {
    const requestedLine = Math.max(cursor.line, 0);
    let currentLine = 0;
    let currentLineStart = 0;
    let requestedLineLength: number | null = null;

    for (let index = 0; index < content.length; index += 1) {
        if (content.charCodeAt(index) !== 10) {
            continue;
        }

        if (currentLine === requestedLine) {
            requestedLineLength = index - currentLineStart;
        }

        currentLine += 1;
        currentLineStart = index + 1;
    }

    const finalLineLength = content.length - currentLineStart;

    if (currentLine === requestedLine) {
        requestedLineLength = finalLineLength;
    }

    return {
        line: Math.min(requestedLine, currentLine),
        lineLength: requestedLineLength ?? finalLineLength,
    };
}
