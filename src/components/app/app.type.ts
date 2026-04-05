import type { HugeiconsProps } from "@hugeicons/react";
import type {
    ButtonHTMLAttributes,
    FocusEvent,
    PointerEvent,
    ReactElement,
    ReactNode,
    Ref,
} from "react";
import type { AppInputSize } from "../../constants/app/input";
import type { UseWorkspaceExecutorResult } from "../../hooks/workspace/useWorkspaceExecutor";
import type { UseWorkspaceSessionResult } from "../../hooks/workspace/useWorkspaceSession.type";
import type {
    AppCommandPaletteScope,
    AppIconGlyph,
    AppSidebarItem,
    AppCommandPaletteMode as RequestedAppCommandPaletteMode,
} from "../../lib/app/app.type";
import type { TooltipSide } from "../../lib/tooltip/tooltip.type";

export type AppAnimatedTextProps = {
    text: string;
};

export type AnimatedCharacter = {
    character: string;
    delayMs: number;
    key: string;
};

export type AppCommandPaletteProps = {
    isOpen: boolean;
    requestedScope: AppCommandPaletteScope | null;
    requestedMode: RequestedAppCommandPaletteMode | null;
    workspaceSession: UseWorkspaceSessionResult;
    isSidebarOpen: boolean;
    onClose: () => void;
    onGoToLine: (lineNumber: number) => void;
    onToggleSidebar: () => void;
    onOpenSettings: () => void;
};

export type AppCommandPaletteScopeButtonProps = {
    ariaLabel: string;
    content: string;
    shortcut: string;
    icon: AppIconGlyph;
    isPressed: boolean;
    onClick: () => void;
};

export type AppIconProps = Omit<HugeiconsProps, "icon"> & {
    icon: AppIconGlyph;
};

export type AppIconButtonProps = Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "aria-label" | "children"
> & {
    ariaLabel: string;
    children: ReactNode;
    isActive?: boolean;
};

export type AppInputProps = {
    value: string;
    ariaLabel: string;
    onChange: (value: string) => void;
    minValue?: number;
    maxValue?: number;
    maxLength?: number;
    inputMode?:
        | "text"
        | "numeric"
        | "decimal"
        | "search"
        | "email"
        | "url"
        | "tel";
    suffix?: string;
    prefix?: ReactElement;
    placeholder?: string;
    isReadOnly?: boolean;
    step?: number;
    size?: AppInputSize;
    className?: string;
};

export type AppSelectOption<TValue extends string> = {
    value: TValue;
    label: string;
};

export type AppSelectProps<TValue extends string> = {
    value: TValue;
    options: readonly AppSelectOption<TValue>[];
    onChange: (value: TValue) => void;
    className?: string;
};

export type AppSettingsToggleProps = {
    label: string;
    description: string;
    isEnabled: boolean;
    onChange: () => void;
    children?: ReactNode;
};

export type AppSidebarProps = {
    isOpen: boolean;
    activeItem: AppSidebarItem;
    showsSettingsUpdateIndicator: boolean;
    onSelectItem: (item: AppSidebarItem) => void;
};

export type AppTooltipProps = {
    children: ReactElement<TooltipTriggerProps>;
    content: ReactNode;
    shortcut?: ReactNode;
    side?: TooltipSide;
    offset?: number;
    delayMs?: number;
    disabled?: boolean;
};

export type TooltipTriggerProps = {
    "aria-describedby"?: string;
    onPointerEnter?: (event: PointerEvent<HTMLElement>) => void;
    onPointerLeave?: (event: PointerEvent<HTMLElement>) => void;
    onFocus?: (event: FocusEvent<HTMLElement>) => void;
    onBlur?: (event: FocusEvent<HTMLElement>) => void;
    onPointerDown?: (event: PointerEvent<HTMLElement>) => void;
    ref?: Ref<HTMLElement>;
};

export type AppTooltipLayerProps = {
    id: string;
    content: ReactNode;
    shortcut?: ReactNode;
    side: TooltipSide;
    top: number;
    left: number;
    isVisible: boolean;
};

export type AppTopbarExecutorControlsProps = Pick<
    UseWorkspaceExecutorResult,
    | "port"
    | "isAttached"
    | "didRecentAttachFail"
    | "isBusy"
    | "updatePort"
    | "toggleConnection"
>;

export type AppTopbarProps = {
    title: string;
    isSidebarOpen: boolean;
    onToggleSidebar: () => void;
    workspaceName?: string | null;
    workspacePath?: string | null;
    onOpenWorkspace?: () => void;
    executorControls?: AppTopbarExecutorControlsProps;
};

export type TrafficLightTone = "close" | "minimize" | "maximize";

export type TrafficLightButtonProps = {
    glyph: ReactElement;
    label: string;
    onClick: () => void;
    tone: TrafficLightTone;
    isActive?: boolean;
};

export type MaximizeGlyphProps = {
    isWindowMaximized: boolean;
};
