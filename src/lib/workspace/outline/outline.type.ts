import type { LuauFileAnalysis } from "../../luau/symbolScanner/symbolScanner.type";

export type WorkspaceOutlineCacheEntry = {
    analysis: LuauFileAnalysis;
    content: string;
    contentRevision: number;
    fileName: string;
};

export type WorkspaceOutlinePoint = {
    column: number;
    row: number;
};

export type WorkspaceOutlineChange = {
    action: "insert" | "remove";
    end: WorkspaceOutlinePoint;
    lines: string[];
    start: WorkspaceOutlinePoint;
};

export type WorkspaceIncrementalOutlineUpdateOptions = {
    change: WorkspaceOutlineChange;
    nextContent: string;
    previousAnalysis: LuauFileAnalysis;
    previousContent: string;
};
