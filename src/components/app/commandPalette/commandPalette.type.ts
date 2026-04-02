import type { ChangeEvent, KeyboardEvent, RefObject } from "react";
import type {
    AppCommandPaletteItem,
    AppCommandPaletteMode,
    AppCommandPaletteScope,
} from "../../../lib/app/app.type";

export type AppCommandPaletteInputRowProps = {
    inputRef: RefObject<HTMLInputElement | null>;
    mode: "default" | AppCommandPaletteMode;
    query: string;
    scope: AppCommandPaletteScope;
    scopeLabels: Record<AppCommandPaletteScope, string>;
    scopePlaceholders: Record<AppCommandPaletteScope, string>;
    onInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
    onInputKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
    onScopeSelect: (scope: Exclude<AppCommandPaletteScope, "tabs">) => void;
};

export type AppCommandPaletteResultsProps = {
    activeResultIndex: number;
    isClosing: boolean;
    results: AppCommandPaletteItem[];
    onCommitSelection: (item: AppCommandPaletteItem) => void;
    onHoverItem: (index: number) => void;
};
