import type { ReactElement } from "react";
import type { AccountsErrorBannerProps } from "./accountsScreen.type";

export function AccountsErrorBanner({
    errorMessage,
    onDismiss,
}: AccountsErrorBannerProps): ReactElement {
    return (
        <div className="rounded-[1rem] border border-red-200 bg-red-50 px-4 py-3 shadow-[var(--shadow-app-card)]">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-red-500">
                        Accounts Error
                    </p>
                    <p className="mt-2 text-sm leading-6 text-red-600">
                        {errorMessage}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onDismiss}
                    className="text-xs font-semibold text-red-500 transition-colors hover:text-red-700"
                >
                    Dismiss
                </button>
            </div>
        </div>
    );
}
