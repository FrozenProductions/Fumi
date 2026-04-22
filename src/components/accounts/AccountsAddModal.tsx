import type { ReactElement } from "react";
import type { AccountsAddModalProps } from "./accountsScreen.type";

export function AccountsAddModal({
    closeAddModal,
    draftCookie,
    isOpen,
    isSubmittingAdd,
    setDraftCookie,
    submitAddAccount,
}: AccountsAddModalProps): ReactElement | null {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="absolute inset-0 z-10 flex items-center justify-center px-4">
            <div className="w-full max-w-lg rounded-[0.9rem] border border-fumi-200 bg-fumi-50 p-5 shadow-[var(--shadow-app-floating)]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-fumi-500">
                    Add Account
                </p>
                <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-fumi-900">
                    Save a Roblox cookie locally
                </h2>
                <p className="mt-3 text-sm leading-6 text-fumi-400">
                    Paste a{" "}
                    <span className="font-semibold text-fumi-600">
                        .ROBLOSECURITY
                    </span>{" "}
                    cookie. Fumi will validate it, resolve the Roblox profile,
                    and store it in the app data folder.
                </p>

                <label className="mt-5 block">
                    <span className="mb-2 block text-xs font-semibold text-fumi-600">
                        Roblox Cookie
                    </span>
                    <textarea
                        value={draftCookie}
                        onChange={(event) => {
                            setDraftCookie(event.target.value);
                        }}
                        rows={6}
                        placeholder="Paste your .ROBLOSECURITY cookie"
                        className="min-h-32 max-h-80 w-full resize-y rounded-[1rem] border border-fumi-200 bg-fumi-50 px-4 py-3 text-sm text-fumi-800 outline-none transition-[border-color,box-shadow] placeholder:text-fumi-400 focus:border-fumi-300 focus:ring-2 focus:ring-fumi-200"
                    />
                </label>

                <div className="mt-5 flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={closeAddModal}
                        disabled={isSubmittingAdd}
                        className="app-select-none inline-flex h-9 items-center justify-center rounded-[0.75rem] border border-fumi-200 bg-fumi-50 px-4 text-xs font-semibold text-fumi-600 transition-colors hover:bg-fumi-100 disabled:pointer-events-none disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            void submitAddAccount();
                        }}
                        disabled={isSubmittingAdd}
                        className="app-select-none inline-flex h-9 items-center justify-center rounded-[0.75rem] bg-fumi-600 px-4 text-xs font-semibold text-fumi-50 transition-colors hover:bg-fumi-500 disabled:pointer-events-none disabled:opacity-50"
                    >
                        {isSubmittingAdd ? "Saving..." : "Save Account"}
                    </button>
                </div>
            </div>
        </div>
    );
}
