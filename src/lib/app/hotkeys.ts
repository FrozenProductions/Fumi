import type { Hotkey } from "@tanstack/hotkeys";
import { formatForDisplay } from "@tanstack/react-hotkeys";

export function createAppHotkey<TBinding extends Hotkey | (string & {})>(
    binding: TBinding,
): {
    binding: TBinding;
    label: string;
} {
    return {
        binding,
        label: formatForDisplay(binding),
    };
}
