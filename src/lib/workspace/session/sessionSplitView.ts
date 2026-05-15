import { DEFAULT_WORKSPACE_SPLIT_RATIO } from "../../../constants/workspace/workspace";
import { normalizeWorkspaceSplitRatio } from "../splitView";
import type { WorkspaceSession } from "./session.type";
import type {
    WorkspaceLegacySplitView,
    WorkspaceSplitDirection,
    WorkspaceSplitGroupNode,
    WorkspaceSplitNode,
    WorkspaceSplitPaneNode,
    WorkspaceSplitPlacement,
    WorkspaceSplitView,
} from "./sessionSplitView.type";
import type { WorkspaceTabState } from "./tabs/sessionTabs.type";

type WorkspaceSplitPanePath = {
    pane: WorkspaceSplitPaneNode;
    path: number[];
};

const ROOT_PANE_ID = "pane-root";
const ROOT_SPLIT_ID = "split-root";

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function isSplitPaneNode(
    node: WorkspaceSplitNode,
): node is WorkspaceSplitPaneNode {
    return node.type === "pane";
}

function getPlacementDirection(
    placement: WorkspaceSplitPlacement,
): WorkspaceSplitDirection {
    return placement === "left" || placement === "right"
        ? "horizontal"
        : "vertical";
}

function isPlacementBefore(placement: WorkspaceSplitPlacement): boolean {
    return placement === "left" || placement === "top";
}

function createPaneId(tabId: string, existingPaneIds: Set<string>): string {
    const sanitizedTabId = tabId.replace(/[^a-zA-Z0-9_-]/gu, "-");
    const basePaneId = `pane-${sanitizedTabId || "tab"}`;

    if (!existingPaneIds.has(basePaneId)) {
        return basePaneId;
    }

    let suffix = 2;
    let nextPaneId = `${basePaneId}-${suffix}`;

    while (existingPaneIds.has(nextPaneId)) {
        suffix += 1;
        nextPaneId = `${basePaneId}-${suffix}`;
    }

    return nextPaneId;
}

function createSplitId(existingSplitIds: Set<string>): string {
    const baseSplitId = "split";

    if (!existingSplitIds.has(baseSplitId)) {
        return baseSplitId;
    }

    let suffix = 2;
    let nextSplitId = `${baseSplitId}-${suffix}`;

    while (existingSplitIds.has(nextSplitId)) {
        suffix += 1;
        nextSplitId = `${baseSplitId}-${suffix}`;
    }

    return nextSplitId;
}

function collectSplitIds(
    node: WorkspaceSplitNode,
    splitIds = new Set<string>(),
): Set<string> {
    if (isSplitPaneNode(node)) {
        return splitIds;
    }

    splitIds.add(node.id);
    node.children.forEach((child) => {
        collectSplitIds(child, splitIds);
    });
    return splitIds;
}

export function collectWorkspacePaneIds(
    node: WorkspaceSplitNode,
    paneIds = new Set<string>(),
): Set<string> {
    if (isSplitPaneNode(node)) {
        paneIds.add(node.id);
        return paneIds;
    }

    node.children.forEach((child) => {
        collectWorkspacePaneIds(child, paneIds);
    });
    return paneIds;
}

export function getWorkspaceSplitPanes(
    node: WorkspaceSplitNode,
): WorkspaceSplitPaneNode[] {
    if (isSplitPaneNode(node)) {
        return [node];
    }

    return node.children.flatMap((child) => getWorkspaceSplitPanes(child));
}

function findPanePath(
    node: WorkspaceSplitNode,
    paneId: string,
    path: number[] = [],
): WorkspaceSplitPanePath | null {
    if (isSplitPaneNode(node)) {
        return node.id === paneId ? { pane: node, path } : null;
    }

    for (const [index, child] of node.children.entries()) {
        const result = findPanePath(child, paneId, [...path, index]);

        if (result) {
            return result;
        }
    }

    return null;
}

function getNodeAtPath(
    node: WorkspaceSplitNode,
    path: readonly number[],
): WorkspaceSplitNode | null {
    if (path.length === 0) {
        return node;
    }

    if (isSplitPaneNode(node)) {
        return null;
    }

    const [nextIndex, ...remainingPath] = path;

    if (nextIndex === undefined) {
        return node;
    }

    const child = node.children[nextIndex];

    return child ? getNodeAtPath(child, remainingPath) : null;
}

function findPaneForTab(
    node: WorkspaceSplitNode,
    tabId: string,
): WorkspaceSplitPanePath | null {
    if (isSplitPaneNode(node)) {
        return node.tabIds.includes(tabId) ? { pane: node, path: [] } : null;
    }

    for (const [index, child] of node.children.entries()) {
        const result = findPaneForTab(child, tabId);

        if (result) {
            return {
                pane: result.pane,
                path: [index, ...result.path],
            };
        }
    }

    return null;
}

function updateNodeAtPath(
    node: WorkspaceSplitNode,
    path: readonly number[],
    updateNode: (node: WorkspaceSplitNode) => WorkspaceSplitNode | null,
): WorkspaceSplitNode | null {
    if (path.length === 0) {
        return updateNode(node);
    }

    if (isSplitPaneNode(node)) {
        return node;
    }

    const [nextIndex, ...remainingPath] = path;

    if (nextIndex === undefined) {
        return node;
    }

    const nextChildren = node.children
        .map((child, index) =>
            index === nextIndex
                ? updateNodeAtPath(child, remainingPath, updateNode)
                : child,
        )
        .filter((child): child is WorkspaceSplitNode => child !== null);

    return normalizeGroupNode({
        ...node,
        children: nextChildren,
        ratios: node.ratios.slice(0, nextChildren.length),
    });
}

function updateSplitGroupById(
    node: WorkspaceSplitNode,
    splitId: string,
    updateGroup: (
        node: WorkspaceSplitGroupNode,
    ) => WorkspaceSplitGroupNode | null,
): WorkspaceSplitNode | null {
    if (isSplitPaneNode(node)) {
        return node;
    }

    if (node.id === splitId) {
        return normalizeGroupNode(updateGroup(node) ?? node);
    }

    const children = node.children
        .map((child) => updateSplitGroupById(child, splitId, updateGroup))
        .filter((child): child is WorkspaceSplitNode => child !== null);

    return normalizeGroupNode({
        ...node,
        children,
    });
}

function normalizeRatios(count: number, ratios: readonly number[]): number[] {
    if (count <= 0) {
        return [];
    }

    const sanitizedRatios = ratios
        .slice(0, count)
        .map((ratio) =>
            Number.isFinite(ratio)
                ? normalizeWorkspaceSplitRatio(ratio)
                : DEFAULT_WORKSPACE_SPLIT_RATIO,
        );

    while (sanitizedRatios.length < count) {
        sanitizedRatios.push(1 / count);
    }

    const total = sanitizedRatios.reduce((sum, ratio) => sum + ratio, 0);

    if (total <= 0) {
        return Array.from({ length: count }, () => 1 / count);
    }

    return sanitizedRatios.map((ratio) => ratio / total);
}

function normalizeGroupNode(
    group: WorkspaceSplitGroupNode,
): WorkspaceSplitNode | null {
    if (group.children.length === 0) {
        return null;
    }

    if (group.children.length === 1) {
        return group.children[0] ?? null;
    }

    return {
        ...group,
        ratios: normalizeRatios(group.children.length, group.ratios),
    };
}

function getSplitViewFromRoot(
    root: WorkspaceSplitNode | null,
    activePaneId: string,
): WorkspaceSplitView | null {
    if (!root || isSplitPaneNode(root)) {
        return null;
    }

    const panes = getWorkspaceSplitPanes(root);
    const activePane = panes.find((pane) => pane.id === activePaneId);

    return {
        root,
        activePaneId: activePane?.id ?? panes[0]?.id ?? ROOT_PANE_ID,
    };
}

function normalizePaneTabIds(
    tabIds: readonly string[],
    openTabIds: Set<string>,
    assignedTabIds: Set<string>,
): string[] {
    const nextTabIds: string[] = [];

    for (const tabId of tabIds) {
        if (!openTabIds.has(tabId) || assignedTabIds.has(tabId)) {
            continue;
        }

        assignedTabIds.add(tabId);
        nextTabIds.push(tabId);
    }

    return nextTabIds;
}

function normalizeTreeNode(
    node: WorkspaceSplitNode,
    openTabIds: Set<string>,
    assignedTabIds: Set<string>,
): WorkspaceSplitNode | null {
    if (isSplitPaneNode(node)) {
        const tabIds = normalizePaneTabIds(
            node.tabIds,
            openTabIds,
            assignedTabIds,
        );

        if (tabIds.length === 0) {
            return null;
        }

        const activeTabId =
            node.activeTabId && tabIds.includes(node.activeTabId)
                ? node.activeTabId
                : (tabIds[0] ?? null);

        return {
            ...node,
            activeTabId,
            tabIds,
        };
    }

    const children = node.children
        .map((child) => normalizeTreeNode(child, openTabIds, assignedTabIds))
        .filter((child): child is WorkspaceSplitNode => child !== null);

    return normalizeGroupNode({
        ...node,
        direction: node.direction === "vertical" ? "vertical" : "horizontal",
        children,
    });
}

function isTreeSplitView(splitView: unknown): splitView is WorkspaceSplitView {
    return (
        isRecord(splitView) &&
        isRecord(splitView.root) &&
        typeof splitView.activePaneId === "string"
    );
}

function isLegacySplitView(
    splitView: unknown,
): splitView is WorkspaceLegacySplitView {
    return (
        isRecord(splitView) &&
        typeof splitView.primaryTabId === "string" &&
        typeof splitView.secondaryTabId === "string"
    );
}

function createLegacySplitViewTree(
    splitView: WorkspaceLegacySplitView,
    openTabIds: Set<string>,
): WorkspaceSplitView | null {
    const primaryTabIds = Array.from(openTabIds).filter(
        (tabId) => !splitView.secondaryTabIds?.includes(tabId),
    );
    const secondaryTabIds = (
        splitView.secondaryTabIds ?? [splitView.secondaryTabId]
    ).filter((tabId) => openTabIds.has(tabId));

    if (
        !openTabIds.has(splitView.primaryTabId) ||
        !openTabIds.has(splitView.secondaryTabId) ||
        splitView.primaryTabId === splitView.secondaryTabId ||
        primaryTabIds.length === 0 ||
        secondaryTabIds.length === 0
    ) {
        return null;
    }

    const direction: WorkspaceSplitDirection =
        splitView.direction === "horizontal" ? "vertical" : "horizontal";
    const primaryPane: WorkspaceSplitPaneNode = {
        type: "pane",
        id: "pane-primary",
        activeTabId: splitView.primaryTabId,
        tabIds: primaryTabIds,
    };
    const secondaryPane: WorkspaceSplitPaneNode = {
        type: "pane",
        id: "pane-secondary",
        activeTabId: splitView.secondaryTabId,
        tabIds: secondaryTabIds,
    };

    return {
        activePaneId:
            splitView.focusedPane === "primary"
                ? primaryPane.id
                : secondaryPane.id,
        root: {
            type: "split",
            id: "split-root",
            direction,
            children: [primaryPane, secondaryPane],
            ratios: normalizeRatios(2, [
                splitView.splitRatio ?? DEFAULT_WORKSPACE_SPLIT_RATIO,
                1 - (splitView.splitRatio ?? DEFAULT_WORKSPACE_SPLIT_RATIO),
            ]),
        },
    };
}

/**
 * Normalizes split view state and migrates the legacy two-pane shape into a split tree.
 */
export function normalizeSplitView(
    splitView: WorkspaceSplitView | WorkspaceLegacySplitView | null,
    openTabIds: Set<string>,
): WorkspaceSplitView | null {
    if (!splitView) {
        return null;
    }

    const treeSplitView = isTreeSplitView(splitView)
        ? splitView
        : isLegacySplitView(splitView)
          ? createLegacySplitViewTree(splitView, openTabIds)
          : null;

    if (!treeSplitView?.root) {
        return null;
    }

    const assignedTabIds = new Set<string>();
    const root = normalizeTreeNode(
        treeSplitView.root,
        openTabIds,
        assignedTabIds,
    );

    if (!root) {
        return null;
    }

    if (isSplitPaneNode(root)) {
        return null;
    }

    const panes = getWorkspaceSplitPanes(root);
    const activePane = panes.find(
        (pane) => pane.id === treeSplitView.activePaneId,
    );

    return {
        root,
        activePaneId: activePane?.id ?? panes[0]?.id ?? ROOT_PANE_ID,
    };
}

export function getWorkspaceActivePane(
    splitView: WorkspaceSplitView | null,
): WorkspaceSplitPaneNode | null {
    if (!splitView?.root || !splitView.activePaneId) {
        return null;
    }

    return findPanePath(splitView.root, splitView.activePaneId)?.pane ?? null;
}

export function getFocusedPaneTabId(
    splitView: WorkspaceSplitView | null,
    activeTabId: string | null,
): string | null {
    return getWorkspaceActivePane(splitView)?.activeTabId ?? activeTabId;
}

/**
 * Returns the tab IDs that share a split pane with the target tab.
 */
export function getWorkspaceSplitScopeTabIds(
    splitView: WorkspaceSplitView | null,
    tabs: readonly Pick<WorkspaceTabState, "id">[],
    tabId: string,
): string[] {
    if (!splitView?.root) {
        return tabs.map((tab) => tab.id);
    }

    const pane = findPaneForTab(splitView.root, tabId)?.pane ?? null;
    const tabIds = new Set(tabs.map((tab) => tab.id));

    return pane?.tabIds.filter((id) => tabIds.has(id)) ?? [];
}

export function getWorkspaceSplitPaneIdForTab(
    splitView: WorkspaceSplitView | null,
    tabId: string,
): string | null {
    if (!splitView?.root) {
        return null;
    }

    return findPaneForTab(splitView.root, tabId)?.pane.id ?? null;
}

export function removedTabFromSplitView(
    splitView: WorkspaceSplitView,
    removedTabId: string,
): WorkspaceSplitView | null {
    if (!splitView.root) {
        return null;
    }

    const panePath = findPaneForTab(splitView.root, removedTabId);

    if (!panePath) {
        return splitView;
    }

    const nextRoot = updateNodeAtPath(splitView.root, panePath.path, (node) => {
        if (!isSplitPaneNode(node)) {
            return node;
        }

        const tabIds = node.tabIds.filter((id) => id !== removedTabId);

        if (tabIds.length === 0) {
            return null;
        }

        return {
            ...node,
            activeTabId:
                node.activeTabId === removedTabId
                    ? (tabIds[0] ?? null)
                    : node.activeTabId,
            tabIds,
        };
    });

    if (!nextRoot) {
        return null;
    }

    return getSplitViewFromRoot(
        nextRoot,
        splitView.activePaneId ?? ROOT_PANE_ID,
    );
}

export function selectWorkspaceTabState(
    currentWorkspace: WorkspaceSession,
    tabId: string,
): WorkspaceSession {
    if (!currentWorkspace.tabs.some((tab) => tab.id === tabId)) {
        return currentWorkspace;
    }

    const splitView = currentWorkspace.splitView;

    if (!splitView?.root) {
        return currentWorkspace.activeTabId === tabId
            ? currentWorkspace
            : {
                  ...currentWorkspace,
                  activeTabId: tabId,
              };
    }

    const panePath = findPaneForTab(splitView.root, tabId);

    if (!panePath) {
        return {
            ...currentWorkspace,
            activeTabId: tabId,
        };
    }

    const nextRoot = updateNodeAtPath(splitView.root, panePath.path, (node) =>
        isSplitPaneNode(node)
            ? {
                  ...node,
                  activeTabId: tabId,
              }
            : node,
    );

    if (!nextRoot) {
        return currentWorkspace;
    }

    return {
        ...currentWorkspace,
        activeTabId: tabId,
        splitView: {
            root: nextRoot,
            activePaneId: panePath.pane.id,
        },
    };
}

function removeTabFromPane(
    root: WorkspaceSplitNode,
    tabId: string,
): WorkspaceSplitNode | null {
    const panePath = findPaneForTab(root, tabId);

    if (!panePath) {
        return root;
    }

    return updateNodeAtPath(root, panePath.path, (node) => {
        if (!isSplitPaneNode(node)) {
            return node;
        }

        const tabIds = node.tabIds.filter((id) => id !== tabId);

        if (tabIds.length === 0) {
            return null;
        }

        return {
            ...node,
            activeTabId:
                node.activeTabId === tabId
                    ? (tabIds[0] ?? null)
                    : node.activeTabId,
            tabIds,
        };
    });
}

function insertPaneAtTarget(
    root: WorkspaceSplitNode,
    targetPaneId: string,
    placement: WorkspaceSplitPlacement,
    newPane: WorkspaceSplitPaneNode,
): WorkspaceSplitNode {
    const targetPath = findPanePath(root, targetPaneId);

    if (!targetPath) {
        return root;
    }

    const direction = getPlacementDirection(placement);
    const shouldInsertBefore = isPlacementBefore(placement);

    if (targetPath.path.length > 0) {
        const parentPath = targetPath.path.slice(0, -1);
        const targetIndex = targetPath.path[targetPath.path.length - 1];
        const parentNode = updateNodeAtPath(root, parentPath, (node) => {
            if (isSplitPaneNode(node) || node.direction !== direction) {
                return node;
            }

            const insertIndex = shouldInsertBefore
                ? targetIndex
                : (targetIndex ?? 0) + 1;
            const children = [...node.children];
            children.splice(insertIndex ?? 0, 0, newPane);

            return {
                ...node,
                children,
                ratios: normalizeRatios(children.length, []),
            };
        });

        const insertedIntoParent =
            parentNode && findPanePath(parentNode, newPane.id) !== null;

        if (parentNode && insertedIntoParent) {
            return parentNode;
        }
    }

    const splitIds = collectSplitIds(root);
    const replacementChildren = shouldInsertBefore
        ? [newPane, targetPath.pane]
        : [targetPath.pane, newPane];
    const replacement: WorkspaceSplitGroupNode = {
        type: "split",
        id: createSplitId(splitIds),
        direction,
        children: replacementChildren,
        ratios: normalizeRatios(replacementChildren.length, []),
    };

    return updateNodeAtPath(root, targetPath.path, () => replacement) ?? root;
}

function createInitialSplitView(
    currentWorkspace: WorkspaceSession,
    tabId: string,
    placement: WorkspaceSplitPlacement,
): WorkspaceSplitView | null {
    const activeTabId = currentWorkspace.activeTabId;

    if (!activeTabId || activeTabId === tabId) {
        const otherTabIds = currentWorkspace.tabs
            .filter((tab) => tab.id !== tabId)
            .map((tab) => tab.id);

        if (otherTabIds.length === 0) {
            return null;
        }

        const existingPane: WorkspaceSplitPaneNode = {
            type: "pane",
            id: ROOT_PANE_ID,
            activeTabId: otherTabIds[0] ?? null,
            tabIds: otherTabIds,
        };
        const newPane: WorkspaceSplitPaneNode = {
            type: "pane",
            id: createPaneId(tabId, new Set([ROOT_PANE_ID])),
            activeTabId: tabId,
            tabIds: [tabId],
        };
        const children = isPlacementBefore(placement)
            ? [newPane, existingPane]
            : [existingPane, newPane];

        return {
            activePaneId: newPane.id,
            root: {
                type: "split",
                id: ROOT_SPLIT_ID,
                direction: getPlacementDirection(placement),
                children,
                ratios: normalizeRatios(children.length, []),
            },
        };
    }

    const existingPane: WorkspaceSplitPaneNode = {
        type: "pane",
        id: ROOT_PANE_ID,
        activeTabId,
        tabIds: currentWorkspace.tabs
            .filter((tab) => tab.id !== tabId)
            .map((tab) => tab.id),
    };
    const newPane: WorkspaceSplitPaneNode = {
        type: "pane",
        id: createPaneId(tabId, new Set([ROOT_PANE_ID])),
        activeTabId: tabId,
        tabIds: [tabId],
    };
    const children = isPlacementBefore(placement)
        ? [newPane, existingPane]
        : [existingPane, newPane];

    return {
        activePaneId: newPane.id,
        root: {
            type: "split",
            id: ROOT_SPLIT_ID,
            direction: getPlacementDirection(placement),
            children,
            ratios: normalizeRatios(children.length, []),
        },
    };
}

export function splitWorkspaceTabState(
    currentWorkspace: WorkspaceSession,
    tabId: string,
    targetPaneId: string | null,
    placement: WorkspaceSplitPlacement,
): WorkspaceSession {
    if (!currentWorkspace.tabs.some((tab) => tab.id === tabId)) {
        return currentWorkspace;
    }

    if (!currentWorkspace.splitView?.root) {
        const nextSplitView = createInitialSplitView(
            currentWorkspace,
            tabId,
            placement,
        );

        return nextSplitView
            ? {
                  ...currentWorkspace,
                  activeTabId: tabId,
                  splitView: nextSplitView,
              }
            : currentWorkspace;
    }

    const targetPane =
        targetPaneId &&
        findPanePath(currentWorkspace.splitView.root, targetPaneId)?.pane;

    if (!targetPane) {
        return currentWorkspace;
    }

    const removedRoot = removeTabFromPane(
        currentWorkspace.splitView.root,
        tabId,
    );

    if (!removedRoot) {
        return currentWorkspace;
    }

    const paneIds = collectWorkspacePaneIds(removedRoot);
    const newPane: WorkspaceSplitPaneNode = {
        type: "pane",
        id: createPaneId(tabId, paneIds),
        activeTabId: tabId,
        tabIds: [tabId],
    };
    const targetAfterRemoval =
        findPanePath(removedRoot, targetPane.id)?.pane ??
        getWorkspaceSplitPanes(removedRoot)[0];

    if (!targetAfterRemoval) {
        return currentWorkspace;
    }

    const nextRoot = insertPaneAtTarget(
        removedRoot,
        targetAfterRemoval.id,
        placement,
        newPane,
    );

    return {
        ...currentWorkspace,
        activeTabId: tabId,
        splitView: {
            root: nextRoot,
            activePaneId: newPane.id,
        },
    };
}

export function moveWorkspaceTabToPaneState(
    currentWorkspace: WorkspaceSession,
    tabId: string,
    paneId: string,
): WorkspaceSession {
    if (!currentWorkspace.splitView?.root) {
        return selectWorkspaceTabState(currentWorkspace, tabId);
    }

    const targetPanePath = findPanePath(
        currentWorkspace.splitView.root,
        paneId,
    );
    const sourcePanePath = findPaneForTab(
        currentWorkspace.splitView.root,
        tabId,
    );

    if (!targetPanePath || !sourcePanePath) {
        return currentWorkspace;
    }

    if (targetPanePath.pane.id === sourcePanePath.pane.id) {
        return selectWorkspaceTabState(currentWorkspace, tabId);
    }

    const removedRoot = removeTabFromPane(
        currentWorkspace.splitView.root,
        tabId,
    );

    if (!removedRoot) {
        return currentWorkspace;
    }

    const refreshedTargetPath = findPanePath(removedRoot, paneId);

    if (!refreshedTargetPath) {
        return currentWorkspace;
    }

    const nextRoot = updateNodeAtPath(
        removedRoot,
        refreshedTargetPath.path,
        (node) => {
            if (!isSplitPaneNode(node)) {
                return node;
            }

            return {
                ...node,
                activeTabId: tabId,
                tabIds: node.tabIds.includes(tabId)
                    ? node.tabIds
                    : [...node.tabIds, tabId],
            };
        },
    );

    if (!nextRoot) {
        return currentWorkspace;
    }

    return {
        ...currentWorkspace,
        activeTabId: tabId,
        splitView: getSplitViewFromRoot(nextRoot, paneId),
    };
}

export function resizeWorkspaceSplitGroupState(
    currentWorkspace: WorkspaceSession,
    splitRatio: number,
    splitId = ROOT_SPLIT_ID,
    dividerIndex = 0,
): WorkspaceSession {
    if (!currentWorkspace.splitView?.root) {
        return currentWorkspace;
    }

    const nextRoot = updateSplitGroupById(
        currentWorkspace.splitView.root,
        splitId,
        (node) => {
            const nextIndex = dividerIndex + 1;

            if (
                dividerIndex < 0 ||
                nextIndex >= node.children.length ||
                node.ratios[dividerIndex] === undefined ||
                node.ratios[nextIndex] === undefined
            ) {
                return node;
            }

            const pairTotal =
                node.ratios[dividerIndex] + node.ratios[nextIndex];
            const normalizedSplitRatio =
                normalizeWorkspaceSplitRatio(splitRatio);
            const ratios = [...node.ratios];
            ratios[dividerIndex] = pairTotal * normalizedSplitRatio;
            ratios[nextIndex] = pairTotal * (1 - normalizedSplitRatio);

            return {
                ...node,
                ratios: normalizeRatios(node.children.length, ratios),
            };
        },
    );

    if (!nextRoot) {
        return currentWorkspace;
    }

    return {
        ...currentWorkspace,
        splitView: getSplitViewFromRoot(
            nextRoot,
            currentWorkspace.splitView.activePaneId ?? ROOT_PANE_ID,
        ),
    };
}

function appendTabsToFirstPane(
    root: WorkspaceSplitNode,
    tabIds: readonly string[],
    activeTabId: string | null,
): WorkspaceSplitNode {
    if (tabIds.length === 0) {
        return root;
    }

    if (isSplitPaneNode(root)) {
        const nextTabIds = [
            ...root.tabIds,
            ...tabIds.filter((id) => !root.tabIds.includes(id)),
        ];

        return {
            ...root,
            activeTabId:
                activeTabId && nextTabIds.includes(activeTabId)
                    ? activeTabId
                    : (root.activeTabId ?? nextTabIds[0] ?? null),
            tabIds: nextTabIds,
        };
    }

    const [firstChild, ...remainingChildren] = root.children;

    if (!firstChild) {
        return root;
    }

    return {
        ...root,
        children: [
            appendTabsToFirstPane(firstChild, tabIds, activeTabId),
            ...remainingChildren,
        ],
    };
}

export function closeWorkspaceFocusedSplitPaneState(
    currentWorkspace: WorkspaceSession,
): WorkspaceSession {
    const splitView = currentWorkspace.splitView;

    if (!splitView?.root || isSplitPaneNode(splitView.root)) {
        return {
            ...currentWorkspace,
            splitView: null,
        };
    }

    const activePaneId =
        splitView.activePaneId ??
        getWorkspaceSplitPanes(splitView.root)[0]?.id ??
        ROOT_PANE_ID;
    const panePath = findPanePath(splitView.root, activePaneId);

    if (!panePath) {
        return currentWorkspace;
    }

    const parentPath = panePath.path.slice(0, -1);
    const paneIndex = panePath.path[panePath.path.length - 1];
    const parentNode = getNodeAtPath(splitView.root, parentPath);

    if (paneIndex === undefined || !parentNode || isSplitPaneNode(parentNode)) {
        return currentWorkspace;
    }

    const targetIndex = paneIndex > 0 ? paneIndex - 1 : paneIndex + 1;
    const targetChild = parentNode.children[targetIndex];

    if (!targetChild) {
        return currentWorkspace;
    }

    const closingTabIds = panePath.pane.tabIds;
    const closingActiveTabId =
        panePath.pane.activeTabId ?? closingTabIds[0] ?? null;
    const targetWithClosingTabs = appendTabsToFirstPane(
        targetChild,
        closingTabIds,
        closingActiveTabId,
    );
    const targetActivePaneId =
        getWorkspaceSplitPanes(targetWithClosingTabs)[0]?.id ?? ROOT_PANE_ID;
    const nextRoot = updateNodeAtPath(splitView.root, parentPath, (node) => {
        if (isSplitPaneNode(node)) {
            return node;
        }

        const children = node.children
            .map((child, index) =>
                index === targetIndex ? targetWithClosingTabs : child,
            )
            .filter((_, index) => index !== paneIndex);
        const ratios = node.ratios.filter((_, index) => index !== paneIndex);

        return normalizeGroupNode({
            ...node,
            children,
            ratios,
        });
    });
    const nextSplitView = getSplitViewFromRoot(nextRoot, targetActivePaneId);
    const nextActiveTabId =
        closingActiveTabId ??
        getWorkspaceActivePane(nextSplitView)?.activeTabId ??
        currentWorkspace.activeTabId;

    return {
        ...currentWorkspace,
        activeTabId: nextActiveTabId,
        splitView: nextSplitView,
    };
}

export function focusWorkspacePaneState(
    currentWorkspace: WorkspaceSession,
    paneId: string,
): WorkspaceSession {
    if (!currentWorkspace.splitView?.root) {
        return currentWorkspace;
    }

    const pane = findPanePath(currentWorkspace.splitView.root, paneId)?.pane;

    if (!pane || pane.id === currentWorkspace.splitView.activePaneId) {
        return currentWorkspace;
    }

    return {
        ...currentWorkspace,
        activeTabId: pane.activeTabId,
        splitView: {
            ...currentWorkspace.splitView,
            activePaneId: pane.id,
        },
    };
}
