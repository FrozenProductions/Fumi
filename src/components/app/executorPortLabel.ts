import { getExecutorBoundAccountLabel } from "../../lib/accounts/accountPrivacy";
import type { ExecutorPortSummary } from "../../lib/workspace/workspace.type";

type ExecutorPortLabelOptions = {
    isMasked?: boolean;
};

export function getExecutorPortLabel(
    summary: ExecutorPortSummary,
    options?: ExecutorPortLabelOptions,
): string {
    return getExecutorBoundAccountLabel(summary, options);
}
