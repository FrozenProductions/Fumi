import type { ReactNode } from "react";

export type AppSettingsToggleProps = {
    label: string;
    description: string;
    isEnabled: boolean;
    onChange: () => void;
    children?: ReactNode;
};
