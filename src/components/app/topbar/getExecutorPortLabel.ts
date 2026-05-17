import { getExecutorBoundAccountLabel } from "../../../lib/accounts/accountPrivacy";
import type { ExecutorPortSummary } from "../../../lib/workspace/executor/executor.type";

type ExecutorPortLabelOptions = {
    isMasked?: boolean;
};

/**
 * Gets a human-readable label for an executor port, handling account privacy masking.
 *
 * @param summary - The executor port summary
 * @param options - Configuration options, such as whether to mask the account
 * @returns A formatted label for the executor port
 */
export function getExecutorPortLabel(
    summary: ExecutorPortSummary,
    options?: ExecutorPortLabelOptions,
): string {
    return getExecutorBoundAccountLabel(summary, options);
}
