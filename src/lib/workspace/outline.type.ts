import type { LuauFileSymbol } from "../luau/luau.type";
import type { LuauFileAnalysis } from "../luau/symbolScanner.type";

export type WorkspaceOutlineScanMode = "full" | "functions";

export type WorkspaceOutlineCacheEntry = {
    contentHash: string;
    contentLength: number;
    fileName: string;
    mode: WorkspaceOutlineScanMode;
    symbols: LuauFileSymbol[];
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
    mode: WorkspaceOutlineScanMode;
    nextContent: string;
    previousAnalysis: LuauFileAnalysis;
    previousContent: string;
};
