import {
    startTransition,
    useCallback,
    useDeferredValue,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    WORKSPACE_OUTLINE_LARGE_FILE_CHAR_THRESHOLD,
    WORKSPACE_OUTLINE_SCAN_IDLE_TIMEOUT_MS,
} from "../../constants/workspace/outline";
import { getEditorModeForFileName } from "../../lib/luau/fileType";
import { scanLuauFileAnalysis } from "../../lib/luau/symbolScanner";
import type { LuauFileAnalysis } from "../../lib/luau/symbolScanner.type";
import { hashString } from "../../lib/shared/hash";
import {
    getWorkspaceOutlineCacheHit,
    incrementallyUpdateWorkspaceOutline,
    storeWorkspaceOutlineCacheEntry,
} from "../../lib/workspace/outline";
import type {
    WorkspaceOutlineCacheEntry,
    WorkspaceOutlineChange,
    WorkspaceOutlineScanMode,
} from "../../lib/workspace/outline.type";
import type { WorkspaceTab } from "../../lib/workspace/workspace.type";
import type { UseWorkspaceOutlineResult } from "./useWorkspaceOutline.type";

export function useWorkspaceOutline(
    activeTab: WorkspaceTab | null,
    isEnabled: boolean,
    change: WorkspaceOutlineChange | null,
): UseWorkspaceOutlineResult {
    const [symbols, setSymbols] = useState<
        UseWorkspaceOutlineResult["symbols"]
    >([]);
    const [manualFullScanHash, setManualFullScanHash] = useState<string | null>(
        null,
    );
    const cacheRef = useRef<Map<string, WorkspaceOutlineCacheEntry>>(new Map());
    const previousActiveTabIdRef = useRef<string | null>(null);
    const previousAnalysisRef = useRef<{
        analysis: LuauFileAnalysis;
        content: string;
        contentHash: string;
        mode: WorkspaceOutlineScanMode;
        tabId: string;
    } | null>(null);
    const activeTabId = activeTab?.id ?? null;
    const activeFileName = activeTab?.fileName ?? null;
    const activeContent = activeTab?.content ?? "";
    const isLargeFile =
        activeContent.length >= WORKSPACE_OUTLINE_LARGE_FILE_CHAR_THRESHOLD;
    const deferredContent = useDeferredValue(activeContent);
    const outlineContent =
        previousActiveTabIdRef.current === activeTabId
            ? deferredContent
            : activeContent;
    const outlineContentHash = useMemo(
        () => hashString(outlineContent),
        [outlineContent],
    );
    const scanMode: WorkspaceOutlineScanMode =
        isLargeFile && manualFullScanHash !== outlineContentHash
            ? "functions"
            : "full";

    const refreshFullSymbols = useCallback((): void => {
        setManualFullScanHash(hashString(activeContent));
    }, [activeContent]);

    useEffect(() => {
        previousActiveTabIdRef.current = activeTabId;
    }, [activeTabId]);

    useEffect(() => {
        if (!isLargeFile) {
            setManualFullScanHash(null);
            return;
        }

        const activeContentHash = hashString(activeContent);

        if (manualFullScanHash === activeContentHash) {
            return;
        }

        setManualFullScanHash(null);
    }, [activeContent, isLargeFile, manualFullScanHash]);

    useEffect(() => {
        if (!activeTabId || !activeFileName) {
            previousAnalysisRef.current = null;
            setSymbols([]);
            return;
        }

        const editorMode = getEditorModeForFileName(activeFileName);

        if (!isEnabled || editorMode !== "luau") {
            setSymbols([]);
            return;
        }

        const cachedEntry = getWorkspaceOutlineCacheHit(
            cacheRef.current,
            activeTabId,
            activeFileName,
            outlineContentHash,
            outlineContent.length,
            scanMode,
        );

        if (cachedEntry) {
            previousAnalysisRef.current = {
                analysis: {
                    functionScopes: [],
                    symbols: cachedEntry.symbols,
                },
                content: outlineContent,
                contentHash: outlineContentHash,
                mode: scanMode,
                tabId: activeTabId,
            };
            startTransition(() => {
                setSymbols(cachedEntry.symbols);
            });
            return;
        }

        const previousAnalysis = previousAnalysisRef.current;

        if (
            previousAnalysis &&
            previousAnalysis.tabId === activeTabId &&
            previousAnalysis.mode === scanMode &&
            previousAnalysis.contentHash !== outlineContentHash &&
            change
        ) {
            const nextAnalysis = incrementallyUpdateWorkspaceOutline({
                change,
                mode: scanMode,
                nextContent: outlineContent,
                previousAnalysis: previousAnalysis.analysis,
                previousContent: previousAnalysis.content,
            });

            if (nextAnalysis) {
                storeWorkspaceOutlineCacheEntry(cacheRef.current, activeTabId, {
                    contentHash: outlineContentHash,
                    contentLength: outlineContent.length,
                    fileName: activeFileName,
                    mode: scanMode,
                    symbols: nextAnalysis.symbols,
                });
                previousAnalysisRef.current = {
                    analysis: nextAnalysis,
                    content: outlineContent,
                    contentHash: outlineContentHash,
                    mode: scanMode,
                    tabId: activeTabId,
                };
                startTransition(() => {
                    setSymbols(nextAnalysis.symbols);
                });
                return;
            }
        }

        let isCancelled = false;
        let idleCallbackId: number | null = null;
        let timeoutId: number | null = null;

        const runScan = (): void => {
            if (isCancelled) {
                return;
            }

            try {
                const analysis = scanLuauFileAnalysis(outlineContent, {
                    mode: scanMode,
                });

                if (isCancelled) {
                    return;
                }

                storeWorkspaceOutlineCacheEntry(cacheRef.current, activeTabId, {
                    contentHash: outlineContentHash,
                    contentLength: outlineContent.length,
                    fileName: activeFileName,
                    mode: scanMode,
                    symbols: analysis.symbols,
                });
                previousAnalysisRef.current = {
                    analysis,
                    content: outlineContent,
                    contentHash: outlineContentHash,
                    mode: scanMode,
                    tabId: activeTabId,
                };

                startTransition(() => {
                    setSymbols(analysis.symbols);
                });
            } catch {
                if (isCancelled) {
                    return;
                }

                previousAnalysisRef.current = null;
                startTransition(() => {
                    setSymbols([]);
                });
            }
        };

        if (typeof window.requestIdleCallback === "function") {
            idleCallbackId = window.requestIdleCallback(runScan, {
                timeout: WORKSPACE_OUTLINE_SCAN_IDLE_TIMEOUT_MS,
            });
        } else {
            timeoutId = window.setTimeout(runScan, 0);
        }

        return () => {
            isCancelled = true;

            if (
                idleCallbackId !== null &&
                typeof window.cancelIdleCallback === "function"
            ) {
                window.cancelIdleCallback(idleCallbackId);
            }

            if (timeoutId !== null) {
                window.clearTimeout(timeoutId);
            }
        };
    }, [
        activeFileName,
        activeTabId,
        change,
        isEnabled,
        outlineContent,
        outlineContentHash,
        scanMode,
    ]);

    return {
        canRefreshFullSymbols: isLargeFile && scanMode !== "full",
        isShowingFunctionsOnly: isLargeFile && scanMode === "functions",
        refreshFullSymbols,
        symbols,
    };
}
