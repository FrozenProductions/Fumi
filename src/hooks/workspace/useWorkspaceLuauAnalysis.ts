import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import {
    WORKSPACE_OUTLINE_LARGE_FILE_THRESHOLD,
    WORKSPACE_OUTLINE_SCAN_IDLE_TIMEOUT_MS,
    WORKSPACE_OUTLINE_SCAN_LARGE_FILE_DEBOUNCE_MS,
    WORKSPACE_OUTLINE_SCAN_STANDARD_DEBOUNCE_MS,
} from "../../constants/workspace/outline";
import { analyzeLuauFileInBackground } from "../../lib/luau/analysis/workerAnalysis";
import { getEditorModeForFileName } from "../../lib/luau/fileType";
import type { LuauFileAnalysis } from "../../lib/luau/symbolScanner/symbolScanner.type";
import {
    getWorkspaceOutlineCacheHit,
    incrementallyUpdateWorkspaceOutline,
    storeWorkspaceOutlineCacheEntry,
} from "../../lib/workspace/outline/outline";
import type {
    WorkspaceOutlineCacheEntry,
    WorkspaceOutlineChange,
} from "../../lib/workspace/outline/outline.type";
import type { WorkspaceTab } from "../../lib/workspace/workspace.type";
import { useDebouncedValue } from "../shared/useDebouncedValue";
import type { UseWorkspaceLuauAnalysisResult } from "./useWorkspaceLuauAnalysis.type";

/**
 * Manages Luau file analysis lifecycle with caching and incremental updates.
 *
 * @remarks
 * Uses requestIdleCallback for background scanning, caches analysis results
 * by per-tab content revision, and performs incremental updates when only
 * content changes occur. Debounces analysis updates through startTransition
 * for smooth UI.
 */
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
        contentRevision: number;
        tabId: string;
    } | null>(null);
    const requestSequenceRef = useRef(0);
    const latestScanTargetRef = useRef<{
        contentRevision: number;
        tabId: string;
    } | null>(null);
    const activeTabId = activeTab?.id ?? null;
    const activeFileName = activeTab?.fileName ?? null;
    const activeContent = activeTab?.content ?? "";
    const activeContentRevision = activeTab?.contentRevision ?? 0;
    const analysisDebounceMs =
        activeContent.length >= WORKSPACE_OUTLINE_LARGE_FILE_THRESHOLD
            ? WORKSPACE_OUTLINE_SCAN_LARGE_FILE_DEBOUNCE_MS
            : WORKSPACE_OUTLINE_SCAN_STANDARD_DEBOUNCE_MS;
    const debouncedOutlineTarget = useDebouncedValue(
        {
            content: activeContent,
            contentRevision: activeContentRevision,
        },
        analysisDebounceMs,
    );
    const outlineTarget = useMemo(
        () =>
            previousActiveTabIdRef.current === activeTabId
                ? debouncedOutlineTarget
                : {
                      content: activeContent,
                      contentRevision: activeContentRevision,
                  },
        [
            activeContent,
            activeContentRevision,
            activeTabId,
            debouncedOutlineTarget,
        ],
    );
    const outlineContent = outlineTarget.content;
    const outlineContentRevision = outlineTarget.contentRevision;

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
            outlineContent,
            outlineContentRevision,
        );

        if (cachedEntry) {
            previousAnalysisRef.current = {
                analysis: cachedEntry.analysis,
                content: outlineContent,
                contentRevision: outlineContentRevision,
                tabId: activeTabId,
            };
            latestScanTargetRef.current = {
                contentRevision: outlineContentRevision,
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
            previousAnalysis.contentRevision !== outlineContentRevision &&
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
                    content: outlineContent,
                    contentRevision: outlineContentRevision,
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
                    contentRevision: outlineContentRevision,
                    tabId: activeTabId,
                };
                latestScanTargetRef.current = {
                    contentRevision: outlineContentRevision,
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
            contentRevision: outlineContentRevision,
            tabId: activeTabId,
        };

        const runScan = (): void => {
            if (isCancelled) {
                return;
            }

            void analyzeLuauFileInBackground({
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
                        latestScanTarget.contentRevision !==
                            outlineContentRevision
                    ) {
                        return;
                    }

                    const cacheEntry: WorkspaceOutlineCacheEntry = {
                        analysis: nextAnalysis,
                        content: outlineContent,
                        contentRevision: outlineContentRevision,
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
                        contentRevision: outlineContentRevision,
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
        outlineContentRevision,
    ]);

    return {
        analysis,
        symbols: analysis?.symbols ?? [],
    };
}
