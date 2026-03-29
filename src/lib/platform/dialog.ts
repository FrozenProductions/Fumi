import { confirm, open } from "@tauri-apps/plugin-dialog";
import { APP_TITLE } from "../../constants/app/app";

export async function confirmAction(message: string): Promise<boolean> {
    return confirm(message, {
        title: APP_TITLE,
        kind: "warning",
    });
}

export async function pickDirectory(
    defaultPath?: string,
): Promise<string | null> {
    const selection = await open({
        directory: true,
        multiple: false,
        defaultPath,
    });

    return typeof selection === "string" ? selection : null;
}
