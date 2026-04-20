import type { LuauFileAnalysis, LuauScanMode } from "./symbolScanner.type";

export type LuauAnalysisWorkerRequest = {
    id: number;
    type: "scan";
    content: string;
    mode?: LuauScanMode;
};

export type LuauAnalysisWorkerResponse =
    | {
          id: number;
          type: "result";
          analysis: LuauFileAnalysis;
      }
    | {
          id: number;
          type: "error";
          message: string;
      };
