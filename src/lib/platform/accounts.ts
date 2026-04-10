import { invoke } from "@tauri-apps/api/core";
import { Effect, Schema } from "effect";
import type {
    AccountListResponse,
    AccountSummary,
    RobloxProcessInfo,
} from "../accounts/accounts.type";
import { runPromise } from "../shared/effectRuntime";
import { getUnknownCauseMessage } from "../shared/errorMessage";
import { decodeUnknownWithSchema } from "../shared/schema";
import { AccountsCommandError } from "./errors";
import { isTauriEnvironment } from "./runtime";

const DESKTOP_SHELL_REQUIRED_ERROR =
    "Accounts commands require the Tauri desktop shell.";

const AccountStatusSchema = Schema.Literal("active", "offline");

const AccountSummarySchema = Schema.Struct({
    id: Schema.String,
    userId: Schema.Number,
    username: Schema.String,
    displayName: Schema.String,
    avatarUrl: Schema.NullOr(Schema.String),
    status: AccountStatusSchema,
    lastLaunchedAt: Schema.NullOr(Schema.Number),
});

const AccountListResponseSchema = Schema.Struct({
    accounts: Schema.Array(AccountSummarySchema),
    isRobloxRunning: Schema.Boolean,
});

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

function invokeAccountsCommandEffect<A, I>(
    command: string,
    schema: Schema.Schema<A, I, never>,
    operation: string,
    args?: Record<string, unknown>,
): Effect.Effect<A, AccountsCommandError> {
    return Effect.tryPromise({
        try: () => invoke<unknown>(command, args),
        catch: (error) =>
            createAccountsCommandError(
                operation,
                error,
                `Could not complete ${operation}.`,
            ),
    }).pipe(
        Effect.flatMap((value) =>
            decodeUnknownWithSchema(
                schema,
                value,
                () =>
                    new AccountsCommandError({
                        operation,
                        message: `Unexpected response shape for ${operation}.`,
                    }),
            ),
        ),
    );
}

function invokeAccountsVoidCommandEffect(
    command: string,
    operation: string,
    args?: Record<string, unknown>,
): Effect.Effect<void, AccountsCommandError> {
    return Effect.tryPromise({
        try: () => invoke<void>(command, args),
        catch: (error) =>
            createAccountsCommandError(
                operation,
                error,
                `Could not complete ${operation}.`,
            ),
    });
}

export function listAccounts(): Promise<AccountListResponse> {
    return runPromise(listAccountsEffect());
}

export function listAccountsEffect(): Effect.Effect<
    AccountListResponse,
    AccountsCommandError
> {
    if (!isTauriEnvironment()) {
        return Effect.succeed({ accounts: [], isRobloxRunning: false });
    }

    return invokeAccountsCommandEffect(
        "list_accounts",
        AccountListResponseSchema,
        "listAccounts",
    );
}

export function addAccount(cookie: string): Promise<AccountSummary> {
    return runPromise(addAccountEffect(cookie));
}

export function addAccountEffect(
    cookie: string,
): Effect.Effect<AccountSummary, AccountsCommandError> {
    if (!isTauriEnvironment()) {
        return Effect.fail(
            new AccountsCommandError({
                operation: "addAccount",
                message: DESKTOP_SHELL_REQUIRED_ERROR,
            }),
        );
    }

    return invokeAccountsCommandEffect(
        "add_account",
        AccountSummarySchema,
        "addAccount",
        { cookie },
    );
}

export function launchAccount(accountId: string): Promise<AccountSummary> {
    return runPromise(launchAccountEffect(accountId));
}

export function launchAccountEffect(
    accountId: string,
): Effect.Effect<AccountSummary, AccountsCommandError> {
    if (!isTauriEnvironment()) {
        return Effect.fail(
            new AccountsCommandError({
                operation: "launchAccount",
                message: DESKTOP_SHELL_REQUIRED_ERROR,
            }),
        );
    }

    return invokeAccountsCommandEffect(
        "launch_account",
        AccountSummarySchema,
        "launchAccount",
        { accountId },
    );
}

export function deleteAccount(accountId: string): Promise<void> {
    return runPromise(deleteAccountEffect(accountId));
}

export function deleteAccountEffect(
    accountId: string,
): Effect.Effect<void, AccountsCommandError> {
    if (!isTauriEnvironment()) {
        return Effect.fail(
            new AccountsCommandError({
                operation: "deleteAccount",
                message: DESKTOP_SHELL_REQUIRED_ERROR,
            }),
        );
    }

    return invokeAccountsVoidCommandEffect("delete_account", "deleteAccount", {
        accountId,
    });
}

export function killRobloxProcesses(): Promise<void> {
    return runPromise(killRobloxProcessesEffect());
}

export function killRobloxProcessesEffect(): Effect.Effect<
    void,
    AccountsCommandError
> {
    if (!isTauriEnvironment()) {
        return Effect.fail(
            new AccountsCommandError({
                operation: "killRobloxProcesses",
                message: DESKTOP_SHELL_REQUIRED_ERROR,
            }),
        );
    }

    return invokeAccountsVoidCommandEffect(
        "kill_roblox_processes",
        "killRobloxProcesses",
    );
}

const RobloxProcessInfoSchema = Schema.Struct({
    pid: Schema.Number,
    startedAt: Schema.Number,
});

const RobloxProcessListSchema = Schema.Array(RobloxProcessInfoSchema);

export function launchRoblox(): Promise<void> {
    return runPromise(launchRobloxEffect());
}

export function launchRobloxEffect(): Effect.Effect<
    void,
    AccountsCommandError
> {
    if (!isTauriEnvironment()) {
        return Effect.fail(
            new AccountsCommandError({
                operation: "launchRoblox",
                message: DESKTOP_SHELL_REQUIRED_ERROR,
            }),
        );
    }

    return invokeAccountsVoidCommandEffect("launch_roblox", "launchRoblox");
}

export function listRobloxProcesses(): Promise<readonly RobloxProcessInfo[]> {
    return runPromise(listRobloxProcessesEffect());
}

export function listRobloxProcessesEffect(): Effect.Effect<
    readonly RobloxProcessInfo[],
    AccountsCommandError
> {
    if (!isTauriEnvironment()) {
        return Effect.succeed([]);
    }

    return invokeAccountsCommandEffect(
        "list_roblox_processes",
        RobloxProcessListSchema,
        "listRobloxProcesses",
    );
}

export function killRobloxProcess(pid: number): Promise<void> {
    return runPromise(killRobloxProcessEffect(pid));
}

export function killRobloxProcessEffect(
    pid: number,
): Effect.Effect<void, AccountsCommandError> {
    if (!isTauriEnvironment()) {
        return Effect.fail(
            new AccountsCommandError({
                operation: "killRobloxProcess",
                message: DESKTOP_SHELL_REQUIRED_ERROR,
            }),
        );
    }

    return invokeAccountsVoidCommandEffect(
        "kill_roblox_process",
        "killRobloxProcess",
        { pid },
    );
}
