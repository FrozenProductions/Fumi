import type { ScriptLibraryEntry } from "../../lib/scriptLibrary/scriptLibrary.type";
import { clampWorkspaceTabBaseName } from "../workspace/fileName";

const SCRIPT_LIBRARY_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
});

export function formatScriptLibraryDate(dateString: string): string {
    if (!dateString) {
        return "Unknown date";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return "Unknown date";
    }

    return SCRIPT_LIBRARY_DATE_FORMATTER.format(date);
}

export function getScriptLibraryPermalink(
    script: Pick<ScriptLibraryEntry, "slug">,
): string {
    return `https://rscripts.net/script/${script.slug}`;
}

export function getWorkspaceScriptFileName(
    script: Pick<ScriptLibraryEntry, "title">,
): string {
    return `${clampWorkspaceTabBaseName(script.title.trim())}.lua`;
}
