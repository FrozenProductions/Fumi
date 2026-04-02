import type { ReactElement } from "react";
import type { AppSettingsToggleProps } from "./app.type";

export function AppSettingsToggle({
    label,
    description,
    isEnabled,
    onChange,
    children,
}: AppSettingsToggleProps): ReactElement {
    return (
        <div className="py-4">
            <div className="flex items-center justify-between gap-6">
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-fumi-900">
                        {label}
                    </p>
                    <p className="mt-1 text-xs leading-[1.55] text-fumi-400">
                        {description}
                    </p>
                </div>
                <button
                    type="button"
                    role="switch"
                    aria-checked={isEnabled}
                    onClick={onChange}
                    className={`relative inline-flex h-[22px] w-[38px] shrink-0 items-center rounded-full border transition-[background-color,border-color,transform] duration-[340ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.03] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-2 focus-visible:ring-offset-fumi-50 motion-reduce:transition-none ${
                        isEnabled
                            ? "border-fumi-600 bg-fumi-600"
                            : "border-fumi-200 bg-fumi-100 hover:border-fumi-300"
                    }`}
                >
                    <span
                        className={`block size-[16px] rounded-full transition-[transform,background-color] duration-[340ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
                            isEnabled
                                ? "translate-x-[17px] scale-100 bg-white"
                                : "translate-x-[2px] scale-[0.96] bg-fumi-300"
                        }`}
                    />
                </button>
            </div>
            {children && isEnabled ? (
                <div className="mt-3 border-l border-fumi-200/80 pl-4">
                    {children}
                </div>
            ) : null}
        </div>
    );
}
