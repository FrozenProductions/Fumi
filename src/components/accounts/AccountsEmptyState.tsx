import { Add01Icon } from "@hugeicons/core-free-icons";
import type { ReactElement } from "react";
import emptyAddIcon from "../../assets/icons/empty_add.svg";
import { createMaskStyle } from "../../lib/shared/mask";
import { AppIcon } from "../app/common/AppIcon";
import type { AccountsEmptyStateProps } from "./accountsScreen.type";

const EMPTY_ADD_ICON_STYLE = createMaskStyle(emptyAddIcon);

export function AccountsEmptyState({
    onOpenAddModal,
}: AccountsEmptyStateProps): ReactElement {
    return (
        <div className="flex flex-1 items-center justify-center bg-fumi-50 p-8">
            <div className="mx-auto flex max-w-lg flex-col items-center text-center">
                <div
                    aria-hidden="true"
                    className="mx-auto h-24 w-24 bg-fumi-600"
                    style={EMPTY_ADD_ICON_STYLE}
                />
                <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.32em] text-fumi-500">
                    No Accounts
                </p>
                <p className="mt-4 text-base leading-7 text-fumi-400">
                    Add a{" "}
                    <span className="font-semibold text-fumi-600">
                        .ROBLOSECURITY
                    </span>{" "}
                    cookie to keep a Roblox account ready for quick launch
                    whenever you need it.
                </p>
                <button
                    type="button"
                    onClick={onOpenAddModal}
                    className="app-select-none mt-6 inline-flex h-10 items-center gap-2 rounded-[0.8rem] border border-fumi-200 bg-fumi-600 px-4 text-sm font-semibold tracking-[0.01em] text-white transition-[background-color,border-color,transform] duration-150 ease-out hover:-translate-y-0.5 hover:border-fumi-700 hover:bg-fumi-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 focus-visible:ring-offset-2 focus-visible:ring-offset-fumi-50"
                >
                    <AppIcon icon={Add01Icon} size={16} strokeWidth={2.4} />
                    Add Account
                </button>
            </div>
        </div>
    );
}
