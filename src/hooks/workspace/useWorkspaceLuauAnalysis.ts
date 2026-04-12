import {
    startTransition,
    useDeferredValue,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { WORKSPACE_OUTLINE_SCAN_IDLE_TIMEOUT_MS } from "../../constants/workspace/outline";
import { getEditorModeForFileName } from "../../lib/luau/fileType";
import type { LuauFileAnalysis } from "../../lib/luau/symbolScanner.type";
import { scanLuauFileAnalysis } from "../../lib/platform/luau";
import { hashString } from "../../lib/shared/hash";
import {
    getWorkspaceOutlineCacheHit,
    incrementallyUpdateWorkspaceOutline,
    storeWorkspaceOutlineCacheEntry,
} from "../../lib/workspace/outline";
import type {
    WorkspaceOutlineCacheEntry,
    WorkspaceOutlineChange,
} from "../../lib/workspace/outline.type";
import type { WorkspaceTab } from "../../lib/workspace/workspace.type";
import type { UseWorkspaceLuauAnalysisResult } from "./useWorkspaceLuauAnalysis.type";

export function useWorkspaceLuauAnalysis(
    activeTab: WorkspaceTab | null,
    isEnabled: boolean,
    change: WorkspaceOutlineChange | null,
): UseWorkspaceLuauAnalysisResult {
    const [analysis, setAnalysis] = useState<LuauFileAnalysis | null>(null);
    const cacheRef = useRef<Map<string, WorkspaceOutlineCacheEntry>>(new Map());
    const previousActiveTabIdRef = useRef<string | null>(null);
    const previousAnalysisRef = useRef<{
        analysis: LuauFileAnalysis;
        content: string;
        contentHash: string;
        tabId: string;
    } | null>(null);
    const requestSequenceRef = useRef(0);
    const latestScanTargetRef = useRef<{
        contentHash: string;
        tabId: string;
    } | null>(null);
    const activeTabId = activeTab?.id ?? null;
    const activeFileName = activeTab?.fileName ?? null;
    const activeContent = activeTab?.content ?? "";
    const deferredContent = useDeferredValue(activeContent);
    const outlineContent =
        previousActiveTabIdRef.current === activeTabId
            ? deferredContent
            : activeContent;
    const outlineContentHash = useMemo(
        () => hashString(outlineContent),
        [outlineContent],
    );

    useEffect(() => {
        previousActiveTabIdRef.current = activeTabId;
    }, [activeTabId]);

    useEffect(() => {
        if (!activeTabId || !activeFileName) {
            previousAnalysisRef.current = null;
            latestScanTargetRef.current = null;
            setAnalysis(null);
            return;
        }

        const editorMode = getEditorModeForFileName(activeFileName);

        if (!isEnabled || editorMode !== "luau") {
            previousAnalysisRef.current = null;
            latestScanTargetRef.current = null;
            setAnalysis(null);
            return;
        }

        const cachedEntry = getWorkspaceOutlineCacheHit(
            cacheRef.current,
            activeTabId,
            activeFileName,
            outlineContentHash,
            outlineContent.length,
        );

        if (cachedEntry) {
            previousAnalysisRef.current = {
                analysis: cachedEntry.analysis,
                content: outlineContent,
                contentHash: outlineContentHash,
                tabId: activeTabId,
            };
            latestScanTargetRef.current = {
                contentHash: outlineContentHash,
                tabId: activeTabId,
            };
            startTransition(() => {
                setAnalysis(cachedEntry.analysis);
            });
            return;
        }

        const previousAnalysis = previousAnalysisRef.current;

        if (
            previousAnalysis &&
            previousAnalysis.tabId === activeTabId &&
            previousAnalysis.contentHash !== outlineContentHash &&
            change
        ) {
            const nextAnalysis = incrementallyUpdateWorkspaceOutline({
                change,
                nextContent: outlineContent,
                previousAnalysis: previousAnalysis.analysis,
                previousContent: previousAnalysis.content,
            });

            if (nextAnalysis) {
                const cacheEntry: WorkspaceOutlineCacheEntry = {
                    analysis: nextAnalysis,
                    contentHash: outlineContentHash,
                    contentLength: outlineContent.length,
                    fileName: activeFileName,
                };

                storeWorkspaceOutlineCacheEntry(
                    cacheRef.current,
                    activeTabId,
                    cacheEntry,
                );
                previousAnalysisRef.current = {
                    analysis: nextAnalysis,
                    content: outlineContent,
                    contentHash: outlineContentHash,
                    tabId: activeTabId,
                };
                latestScanTargetRef.current = {
                    contentHash: outlineContentHash,
                    tabId: activeTabId,
                };
                startTransition(() => {
                    setAnalysis(nextAnalysis);
                });
                return;
            }
        }

        let isCancelled = false;
        let idleCallbackId: number | null = null;
        let timeoutId: number | null = null;
        const requestId = requestSequenceRef.current + 1;

        requestSequenceRef.current = requestId;
        latestScanTargetRef.current = {
            contentHash: outlineContentHash,
            tabId: activeTabId,
        };

        const runScan = (): void => {
            if (isCancelled) {
                return;
            }

            void scanLuauFileAnalysis({
                content: outlineContent,
            })
                .then((nextAnalysis) => {
                    if (
                        isCancelled ||
                        requestSequenceRef.current !== requestId
                    ) {
                        return;
                    }

                    const latestScanTarget = latestScanTargetRef.current;

                    if (
                        !latestScanTarget ||
                        latestScanTarget.tabId !== activeTabId ||
                        latestScanTarget.contentHash !== outlineContentHash
                    ) {
                        return;
                    }

                    const cacheEntry: WorkspaceOutlineCacheEntry = {
                        analysis: nextAnalysis,
                        contentHash: outlineContentHash,
                        contentLength: outlineContent.length,
                        fileName: activeFileName,
                    };

                    storeWorkspaceOutlineCacheEntry(
                        cacheRef.current,
                        activeTabId,
                        cacheEntry,
                    );
                    previousAnalysisRef.current = {
                        analysis: nextAnalysis,
                        content: outlineContent,
                        contentHash: outlineContentHash,
                        tabId: activeTabId,
                    };

                    startTransition(() => {
                        setAnalysis(nextAnalysis);
                    });
                })
                .catch(() => {
                    if (
                        isCancelled ||
                        requestSequenceRef.current !== requestId
                    ) {
                        return;
                    }

                    previousAnalysisRef.current = null;
                    latestScanTargetRef.current = null;
                    startTransition(() => {
                        setAnalysis(null);
                    });
                });
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
    ]);

    return {
        analysis,
        symbols: analysis?.symbols ?? [],
    };
}
