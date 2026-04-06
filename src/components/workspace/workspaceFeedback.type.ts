import type { AppIconGlyph } from "../../lib/app/app.type";

export type WorkspaceErrorBannerProps = {
    errorMessage: string;
};

export type WorkspaceMessageStateProps = {
    eyebrow: string;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
        icon: AppIconGlyph;
        shortcut?: string;
    };
};
