import {
    EXECUTION_HISTORY_LARGE_SCRIPT_MAX_CHARACTERS,
    EXECUTION_HISTORY_LARGE_SCRIPT_MAX_LINES,
} from "../../constants/workspace/executionHistory";

export function isLargeExecutionHistoryScript(scriptContent: string): boolean {
    if (scriptContent.length >= EXECUTION_HISTORY_LARGE_SCRIPT_MAX_CHARACTERS) {
        return true;
    }

    let lineCount = 1;

    for (let index = 0; index < scriptContent.length; index += 1) {
        if (scriptContent[index] !== "\n") {
            continue;
        }

        lineCount += 1;

        if (lineCount >= EXECUTION_HISTORY_LARGE_SCRIPT_MAX_LINES) {
            return true;
        }
    }

    return false;
}
