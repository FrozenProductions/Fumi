import type { AppIconGlyph } from "../../lib/app/app.type";

export type WorkspaceErrorBannerProps = {
    errorMessage: string;
    onClose: () => void;
};

export type WorkspaceMessageStateProps = {
    eyebrow: string;
    title?: string;
    description: string;
    illustrationUrl?: string;
    action?: {
        label: string;
        onClick: () => void;
        icon: AppIconGlyph;
        shortcut?: string;
    };
};
