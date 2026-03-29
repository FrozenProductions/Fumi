import { writeText } from "@tauri-apps/plugin-clipboard-manager";

export async function copyTextToClipboard(text: string): Promise<void> {
    await writeText(text);
}
