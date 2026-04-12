import type { LuauFileAnalysis } from "../luau/symbolScanner.type";

export type WorkspaceOutlineCacheEntry = {
    analysis: LuauFileAnalysis;
    contentHash: string;
    contentLength: number;
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
