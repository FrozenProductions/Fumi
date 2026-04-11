import { invoke } from "@tauri-apps/api/core";
import type {
    AccountListResponse,
    AccountSummary,
    RobloxProcessInfo,
} from "../accounts/accounts.type";
import { getUnknownCauseMessage } from "../shared/errorMessage";
import { isBoolean, isNumber, isRecord, isString } from "../shared/validation";
import { AccountsCommandError } from "./errors";
import { isTauriEnvironment } from "./runtime";

const DESKTOP_SHELL_REQUIRED_ERROR =
    "Accounts commands require the Tauri desktop shell.";

function createAccountsCommandError(
    operation: string,
    error: unknown,
    fallbackMessage: string,
): AccountsCommandError {
    return new AccountsCommandError({
        operation,
        message: getUnknownCauseMessage(error, fallbackMessage),
    });
}

function createInvalidAccountsResponseError(
    operation: string,
): AccountsCommandError {
    return new AccountsCommandError({
        operation,
        message: `Unexpected response shape for ${operation}.`,
    });
}

function parseAccountSummary(
    value: unknown,
    operation: string,
): AccountSummary {
    if (!isRecord(value)) {
        throw createInvalidAccountsResponseError(operation);
    }

    if (
        !isString(value.id) ||
        !isNumber(value.userId) ||
        !isString(value.username) ||
        !isString(value.displayName)
    ) {
        throw createInvalidAccountsResponseError(operation);
    }

    if (value.avatarUrl !== null && !isString(value.avatarUrl)) {
        throw createInvalidAccountsResponseError(operation);
    }

    if (value.status !== "active" && value.status !== "offline") {
        throw createInvalidAccountsResponseError(operation);
    }

    if (value.lastLaunchedAt !== null && !isNumber(value.lastLaunchedAt)) {
        throw createInvalidAccountsResponseError(operation);
    }

    return {
        id: value.id,
        userId: value.userId,
        username: value.username,
        displayName: value.displayName,
        avatarUrl: value.avatarUrl,
        status: value.status,
        lastLaunchedAt: value.lastLaunchedAt,
    };
}

function parseAccountListResponse(
    value: unknown,
    operation: string,
): AccountListResponse {
    if (!isRecord(value) || !Array.isArray(value.accounts)) {
        throw createInvalidAccountsResponseError(operation);
    }

    if (!isBoolean(value.isRobloxRunning)) {
        throw createInvalidAccountsResponseError(operation);
    }

    return {
        accounts: value.accounts.map((account) =>
            parseAccountSummary(account, operation),
        ),
        isRobloxRunning: value.isRobloxRunning,
    };
}

function parseRobloxProcessInfo(
    value: unknown,
    operation: string,
): RobloxProcessInfo {
    if (
        !isRecord(value) ||
        !isNumber(value.pid) ||
        !isNumber(value.startedAt)
    ) {
        throw createInvalidAccountsResponseError(operation);
    }

    return {
        pid: value.pid,
        startedAt: value.startedAt,
    };
}

function parseRobloxProcessList(
    value: unknown,
    operation: string,
): readonly RobloxProcessInfo[] {
    if (!Array.isArray(value)) {
        throw createInvalidAccountsResponseError(operation);
    }

    return value.map((processInfo) =>
        parseRobloxProcessInfo(processInfo, operation),
    );
}

async function invokeAccountsCommand<T>(
    command: string,
    operation: string,
    parseValue: (value: unknown, parseOperation: string) => T,
    args?: Record<string, unknown>,
): Promise<T> {
    try {
        const value = await invoke<unknown>(command, args);
        return parseValue(value, operation);
    } catch (error) {
        if (error instanceof AccountsCommandError) {
            throw error;
        }

        throw createAccountsCommandError(
            operation,
            error,
            `Could not complete ${operation}.`,
        );
    }
}

async function invokeAccountsVoidCommand(
    command: string,
    operation: string,
    args?: Record<string, unknown>,
): Promise<void> {
    try {
        await invoke<void>(command, args);
    } catch (error) {
        throw createAccountsCommandError(
            operation,
            error,
            `Could not complete ${operation}.`,
        );
    }
}

export function listAccounts(): Promise<AccountListResponse> {
    if (!isTauriEnvironment()) {
        return Promise.resolve({ accounts: [], isRobloxRunning: false });
    }

    return invokeAccountsCommand(
        "list_accounts",
        "listAccounts",
        parseAccountListResponse,
    );
}

export function addAccount(cookie: string): Promise<AccountSummary> {
    if (!isTauriEnvironment()) {
        return Promise.reject(
            new AccountsCommandError({
                operation: "addAccount",
                message: DESKTOP_SHELL_REQUIRED_ERROR,
            }),
        );
    }

    return invokeAccountsCommand(
        "add_account",
        "addAccount",
        parseAccountSummary,
        { cookie },
    );
}

export function launchAccount(accountId: string): Promise<AccountSummary> {
    if (!isTauriEnvironment()) {
        return Promise.reject(
            new AccountsCommandError({
                operation: "launchAccount",
                message: DESKTOP_SHELL_REQUIRED_ERROR,
            }),
        );
    }

    return invokeAccountsCommand(
        "launch_account",
        "launchAccount",
        parseAccountSummary,
        { accountId },
    );
}

export function deleteAccount(accountId: string): Promise<void> {
    if (!isTauriEnvironment()) {
        return Promise.reject(
            new AccountsCommandError({
                operation: "deleteAccount",
                message: DESKTOP_SHELL_REQUIRED_ERROR,
            }),
        );
    }

    return invokeAccountsVoidCommand("delete_account", "deleteAccount", {
        accountId,
    });
}

export function killRobloxProcesses(): Promise<void> {
    if (!isTauriEnvironment()) {
        return Promise.reject(
            new AccountsCommandError({
                operation: "killRobloxProcesses",
                message: DESKTOP_SHELL_REQUIRED_ERROR,
            }),
        );
    }

    return invokeAccountsVoidCommand(
        "kill_roblox_processes",
        "killRobloxProcesses",
    );
}

export function launchRoblox(): Promise<void> {
    if (!isTauriEnvironment()) {
        return Promise.reject(
            new AccountsCommandError({
                operation: "launchRoblox",
                message: DESKTOP_SHELL_REQUIRED_ERROR,
            }),
        );
    }

    return invokeAccountsVoidCommand("launch_roblox", "launchRoblox");
}

export function listRobloxProcesses(): Promise<readonly RobloxProcessInfo[]> {
    if (!isTauriEnvironment()) {
        return Promise.resolve([]);
    }

    return invokeAccountsCommand(
        "list_roblox_processes",
        "listRobloxProcesses",
        parseRobloxProcessList,
    );
}

export function killRobloxProcess(pid: number): Promise<void> {
    if (!isTauriEnvironment()) {
        return Promise.reject(
            new AccountsCommandError({
                operation: "killRobloxProcess",
                message: DESKTOP_SHELL_REQUIRED_ERROR,
            }),
        );
    }

    return invokeAccountsVoidCommand(
        "kill_roblox_process",
        "killRobloxProcess",
        { pid },
    );
}
