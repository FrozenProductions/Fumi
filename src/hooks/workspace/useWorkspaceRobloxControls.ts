import { useCallback, useEffect, useRef, useState } from "react";
import type {
    RobloxAccountIdentity,
    RobloxProcessInfo,
} from "../../lib/accounts/accounts.type";
import {
    getLiveRobloxAccount,
    killRobloxProcess as killRobloxProcessCommand,
    killRobloxProcesses as killRobloxProcessesCommand,
    launchRoblox as launchRobloxCommand,
    listRobloxProcesses,
} from "../../lib/platform/accounts";
import { confirmAction } from "../../lib/platform/dialog";
import { isTauriEnvironment } from "../../lib/platform/runtime";
import { useWindowResume } from "../shared/useWindowResume";

type UseWorkspaceRobloxControlsResult = {
    isDesktopShell: boolean;
    robloxProcesses: readonly RobloxProcessInfo[];
    liveRobloxAccount: RobloxAccountIdentity | null;
    isLaunching: boolean;
    isKillingRoblox: boolean;
    killingRobloxProcessPid: number | null;
    launchRoblox: () => Promise<void>;
    killRoblox: () => Promise<void>;
    confirmAndKillRoblox: () => Promise<void>;
    killRobloxProcess: (pid: number) => Promise<void>;
};

export function useWorkspaceRobloxControls(): UseWorkspaceRobloxControlsResult {
    const [robloxProcesses, setRobloxProcesses] = useState<
        readonly RobloxProcessInfo[]
    >([]);
    const [liveRobloxAccount, setLiveRobloxAccount] =
        useState<RobloxAccountIdentity | null>(null);
    const [isLaunching, setIsLaunching] = useState(false);
    const [isKillingRoblox, setIsKillingRoblox] = useState(false);
    const [killingRobloxProcessPid, setKillingRobloxProcessPid] = useState<
        number | null
    >(null);
    const robloxProcessesRequestIdRef = useRef(0);
    const liveRobloxAccountRequestIdRef = useRef(0);
    const isDesktopShell = isTauriEnvironment();

    const refreshRobloxProcesses = useCallback(async (): Promise<void> => {
        const requestId = robloxProcessesRequestIdRef.current + 1;
        robloxProcessesRequestIdRef.current = requestId;

        try {
            const processes = await listRobloxProcesses();

            if (robloxProcessesRequestIdRef.current === requestId) {
                setRobloxProcesses(processes);
            }
        } catch {}
    }, []);

    useWindowResume(
        () => {
            void refreshRobloxProcesses();
        },
        {
            isEnabled: isDesktopShell,
            triggerOnMount: isDesktopShell,
        },
    );

    const refreshLiveRobloxAccount = useCallback(async (): Promise<void> => {
        const requestId = liveRobloxAccountRequestIdRef.current + 1;
        liveRobloxAccountRequestIdRef.current = requestId;

        try {
            const account = await getLiveRobloxAccount();

            if (liveRobloxAccountRequestIdRef.current === requestId) {
                setLiveRobloxAccount(account);
            }
        } catch {
            if (liveRobloxAccountRequestIdRef.current === requestId) {
                setLiveRobloxAccount(null);
            }
        }
    }, []);

    useEffect(() => {
        if (robloxProcesses.length > 0) {
            return;
        }

        liveRobloxAccountRequestIdRef.current += 1;
        setLiveRobloxAccount(null);
    }, [robloxProcesses.length]);

    useWindowResume(
        () => {
            void refreshLiveRobloxAccount();
        },
        {
            isEnabled: isDesktopShell && robloxProcesses.length > 0,
            triggerOnMount: isDesktopShell && robloxProcesses.length > 0,
        },
    );

    const launchRoblox = useCallback(async (): Promise<void> => {
        if (isLaunching) {
            return;
        }

        setIsLaunching(true);

        try {
            await launchRobloxCommand();
        } finally {
            setIsLaunching(false);
            void refreshRobloxProcesses();
        }
    }, [isLaunching, refreshRobloxProcesses]);

    const killRoblox = useCallback(async (): Promise<void> => {
        if (isKillingRoblox || killingRobloxProcessPid !== null) {
            return;
        }

        setIsKillingRoblox(true);

        try {
            await killRobloxProcessesCommand();
        } finally {
            setIsKillingRoblox(false);
            void refreshRobloxProcesses();
        }
    }, [isKillingRoblox, killingRobloxProcessPid, refreshRobloxProcesses]);

    const killRobloxProcess = useCallback(
        async (pid: number): Promise<void> => {
            if (isKillingRoblox || killingRobloxProcessPid !== null) {
                return;
            }

            setKillingRobloxProcessPid(pid);

            try {
                await killRobloxProcessCommand(pid);
            } finally {
                setKillingRobloxProcessPid((currentPid) =>
                    currentPid === pid ? null : currentPid,
                );
                void refreshRobloxProcesses();
            }
        },
        [isKillingRoblox, killingRobloxProcessPid, refreshRobloxProcesses],
    );

    const confirmAndKillRoblox = useCallback(async (): Promise<void> => {
        const shouldKillRoblox = await confirmAction(
            "Attempt to close Roblox?",
        );

        if (!shouldKillRoblox) {
            return;
        }

        await killRoblox();
    }, [killRoblox]);

    return {
        isDesktopShell,
        robloxProcesses,
        liveRobloxAccount,
        isLaunching,
        isKillingRoblox,
        killingRobloxProcessPid,
        launchRoblox,
        killRoblox,
        confirmAndKillRoblox,
        killRobloxProcess,
    };
}
