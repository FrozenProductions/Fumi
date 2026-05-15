import type {
    AppCommandPaletteControllerOptions,
    AppCommandPaletteControllerResult,
} from "../../lib/app/commandPalette/commandPalette.type";
import type {
    AppCommandPaletteScope,
    AppCommandPaletteViewMode,
} from "../../lib/app/commandPalette/commandPaletteDomain.type";

export type UseAppCommandPaletteOptions = AppCommandPaletteControllerOptions;

export type UseAppCommandPaletteResult = AppCommandPaletteControllerResult;

export type AppCommandPaletteState = {
    query: string;
    scope: AppCommandPaletteScope;
    mode: AppCommandPaletteViewMode;
    activeResultIndex: number;
};

export type AppCommandPaletteStateUpdate =
    | Partial<AppCommandPaletteState>
    | ((
          currentState: AppCommandPaletteState,
      ) => Partial<AppCommandPaletteState>);
