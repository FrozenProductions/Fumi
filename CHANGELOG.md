# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog], and this project adheres to [Semantic Versioning].

## [Unreleased]

## [1.0.9] - 2026-05-20

### Added

- Add execution history search and filters.
- Add editor caret and tab spacing settings.
- Add an execute-active-tab hotkey and command palette action.
- Add workspace tab pinning.
- Add bulk tab archive actions, including split-view scoped archive actions.
- Add relative line number settings.
- Add `_G` symbol support to Luau intellisense and outline search.
- Add loadstring entries to the Luau outline panel.
- Add command palette commands for symbols, tab size, and intellisense priority.
- Add Luau beautify command with native beautifier.
- Add focus delay for tabs mode in command palette.
- Add hotkey disable support with Backspace shortcut to disable and re-enable custom hotkey bindings.
- Improve script library search ranking and display titles.

### Changed

- Rework split view behavior and migrate related tests to the pane-tree model.
- Improve split editor typing, tab metadata, split-pane lookup, workspace iteration, account binding summary, Luau completion indexing, and bounded search ranking performance.
- Improve Rust backend reliability across metadata, storage, binary cookie, dialog, and Luau parser flows.
- Reorganize platform wrappers, window helpers, workspace command wrappers, automatic execution rows, Luau completion modules, workspace contracts, app component types, and editor type files into smaller domain files.
- Extract app shell, view startup orchestration, workspace/editor handlers, tab menus, tooltip behavior, command palette items, script library actions, automatic execution flows, account rows, and executor option UI into focused modules.
- Move binary cookie and Roblox process helpers under the accounts backend domain.
- Clean up frontend type ownership, imports, shared validation helpers, editor surface prop types, derived state, deprecated React APIs, and dead code.
- Stabilize workspace action, tab bar, tab item, editor sidebar, tooltip, close-listener, and hook state update flows.
- Polish tab context menu spacing, account list item formatting, script loading labels, settings padding, and Tailwind size utilities.
- Add JSDoc docstrings to exported functions, hooks, and components.
- Replace esbuild with oxc for minification.
- Update dnd-kit and tauri-apps dependencies.
- Upgrade Rust toolchain to 1.89 for smol_str MSRV compatibility.
- Replace O(n) favorite lookup with Set index in script library store.
- Adjust command palette UI sizing and increase max results.
- Refactor codebase into crates.
- Extract types into `.type.ts` sidecars and add docstrings to uncovered code.
- Refine favorite count badge styling.

### Removed

- Trim low-value frontend tests.
- Remove animated text derived state and unused code.
- Remove unused export resetFavoriteScriptIds.
- Remove unused editorValue state and useEffect sync.

### Fixed

- Fix command palette toggle focus.
- Fix app zoom viewport fill behavior.
- Fix archive search header jitter in workspace settings.
- Fix restored split editor layout shifts.
- Fix split tab dirty indicators.
- Scope tab list dropdowns per split pane.
- Prevent tab menu clipping.
- Add typed executor command wrappers for Roblox executor platform calls.
- Improve keyboard focus handling for editor split panes.
- Wrap settings select handlers to avoid passing raw setters through UI props.
- Fix Escape closing command palette in special mode selectors.
- Preserve custom hotkey binding when disabling.
- Persist cursor and scroll positions on app reload.
- Force WorkspaceAcePane remount on tab switch to prevent stale state.

## [1.0.8] - 2026-05-02

### Changed

- Improve command palette focus handling and result rendering performance.
- Refine topbar and workspace action spacing, process action button radius, and related workspace action class structure.

### Fixed

- Prevent executor IPC from blocking the app.
- Fix workspace tab dirty indicators.
- Allow launching Roblox when no supported executor is detected.
- Detect Opiumware installs that use `libOpiumwareNative.dylib`.
- Handle Roblox command failures without unhandled promise rejections.
- Fix Opiumware detach getting stuck in the busy state.
- Fix executor port tooltip indentation in the topbar controls.

## [1.0.7] - 2026-04-26

### Added

- Add streamer mode privacy masking across accounts, executor labels, Roblox process labels, and workspace actions.
- Add executor attach hotkey commands.
- Add an editor word wrap setting.
- Refresh application icon assets.
- Improve drag and drop overlay to match app empty state style.

### Changed

- Improve app resume coordination, workspace editor state churn, Luau outline analysis, tooltip rendering, tab bar scrolling, and Roblox shutdown batching.
- Rework workspace screen orchestration and split oversized accounts, workspace, command palette, Luau, app, UI, and store modules into domain-aligned files.
- Polish workspace actions, Roblox launch and kill affordances, workspace empty state layout, and workspace error banner dismissal.
- Index Luau completion candidates and move Luau worker fallback off the scanner for faster completions.
- Cache script library filtered pages to reduce redundant work.

### Removed

- Remove the executor message event and output panel.
- Remove the execution history large-file optimization.
- Trim low-value frontend tests.

### Fixed

- Restore accounts after screen switches.
- Fix dark theme styling in the workspace actions menu.
- Fix repeated Roblox account binding.
- Fix Luau completion popup updates.
- Avoid splitting editor content during cursor clamps.
- Fix workspace Ace cursor teardown.
- Fix port dropdown layering.
- Keep stale Luau completions visible during updates.
- Keep Luau symbols visible after inserts.
- Fix the go to line shortcut.

## [1.0.6] - 2026-04-21

### Added

- Add live Roblox account details in the accounts screen and bind executor ports to Roblox accounts across the backend and UI.
- Add workspace execution history.
- Add comments into outline panel.
- Add a developer settings section.

### Changed

- Migrate workspace, account, and automatic execution metadata to schema-backed storage.
- Reduce IPC, move blocking Tauri work off hot paths, and cut refresh overhead.
- Speed up workspace rendering, virtualization, and dirty-state tracking.
- Make workspace state retention and UI behavior more reliable.
- Polish accounts, command palette, workspace, and sidebar UX.

### Fixed

- Preserve undo history across tab switches.
- Fix Luau completion popup positioning and disable intellisense inside Luau strings.
- Improve the runtime error screen and fix right sidebar toggle icon direction, execute button resize lag, and outline resize direction.
- Treat zombie Roblox processes as exited and harden Roblox launch and executor status flows.

## [1.0.5] - 2026-04-17

### Added

- Add the automatic execution flow, including a dedicated screen, persistence, and folder opening support.
- Add a sidebar position setting with left and right layouts.
- Add Roblox controls to workspace actions.
- Add Roblox launch and kill hotkeys.
- Add Roblox command palette actions.
- Add workspace drag-and-drop import.
- Add the workspace outline panel with search filtering and bulk controls.

### Changed

- Remove the Effect runtime from the frontend platform layer and return those flows to native async/await.
- Harden the Zustand workspace and script-library stores.
- Move workspace actions into the editor overlay.
- Move Luau analysis into the Tauri backend.
- Persist outline group state and animate the workspace outline panel.
- Rework theme command handling to follow the command palette mode pattern.
- Center settings content.
- Update the editor scope highlight to use the Fumi accent color.
- Remove the outline panel setting and simplify outline keyword handling.

### Fixed

- Fix tab bar drag preview behavior.
- Fix outline line navigation.
- Fix outline resize dragging and workspace outline virtualization.

## [1.0.4] - 2026-04-10

### Added

- Add customizable app hotkeys.
- Add system theme support.
- Add script library favorites.
- Add workspace tab duplication.
- Add workspace split view.

### Changed

- Improve command palette search ranking.
- Refine the settings sidebar, hotkey editing interactions, workspace tab close behavior, and split view close affordances.
- Refactor workspace and command state flows to support newer tab, split view, theme, and hotkey actions.
- Update app configuration and build targets.

### Fixed

- Persist executor ports per executor kind.
- Fix no-op hotkey overrides.
- Fix settings actions when the system theme is active.
- Match unavailable executor button state.
- Prevent app shell overscroll and correct related command palette test coverage.

## [1.0.3] - 2026-04-07

### Added

- Add Luau intellisense for local symbols, actors, and RakNet APIs.
- Add configurable auto-update behavior.
- Add editor search improvements, including focus on toggle and visible match counts.
- Add configurable middle-click tab actions.
- Add more command palette actions, including a shortcut for the Roblox accounts manager.
- Add Opiumware executor support.
- Add support for opening the author link in the browser.

### Changed

- Improve intellisense popup behavior.
- Improve executor copy for MacSploit and Opiumware.
- Reorganize shared types, constants, and view module names.

### Fixed

- Keep Luau completions open for longer matches.
- Toggle editor search with `Cmd+F`.
- Check for updates before opening settings.
- Disable executor actions when no supported executor is detected.

## [1.0.2] - 2026-04-05

### Added

- Add tab context menu actions.
- Add a workspace editor search panel.

### Changed

- Move settings into a dedicated screen.
- Add a settings update badge.
- Use the app icon in macOS native alerts.
- Extract app and Tauri lifecycle wiring into dedicated modules.

### Fixed

- Fix dark theme action states.

## [1.0.1] - 2026-04-04

### Added

- Add frontend unit tests.

### Changed

- Migrate frontend platform flows to Effect.
- Switch to custom macOS traffic lights.
- Allow window close handling and script library clipboard writes through the current Tauri capability setup.
- Tighten the Biome lint configuration.
- Improve settings updater controls and status animations.
- Move repo types into domain-specific `*.type.ts` files.
- Refine text selection across the desktop chrome.
- Update the README to match the current project structure and tech stack.

## [1.0.0] - 2026-03-30

_First public release._

### Added

- Ship the first public release of Fumi.
- Add `esbuild` for Vite production builds.

### Changed

- Raise the Rust toolchain and minimum supported Rust version used in CI.
- Refine the settings updater experience.

### Fixed

- Validate restored app settings.
- Improve packaged app diagnostics.
- Fix Ace loading in production builds.
- Fix Ace interop and Escape hotkeys.

[Unreleased]: https://github.com/FrozenProductions/Fumi/compare/app-v1.0.9...HEAD
[1.0.9]: https://github.com/FrozenProductions/Fumi/compare/app-v1.0.8...app-v1.0.9
[1.0.8]: https://github.com/FrozenProductions/Fumi/compare/app-v1.0.7...app-v1.0.8
[1.0.7]: https://github.com/FrozenProductions/Fumi/compare/app-v1.0.6...app-v1.0.7
[1.0.6]: https://github.com/FrozenProductions/Fumi/compare/app-v1.0.5...app-v1.0.6
[1.0.5]: https://github.com/FrozenProductions/Fumi/compare/app-v1.0.4...app-v1.0.5
[1.0.4]: https://github.com/FrozenProductions/Fumi/compare/app-v1.0.3...app-v1.0.4
[1.0.3]: https://github.com/FrozenProductions/Fumi/compare/app-v1.0.2...app-v1.0.3
[1.0.2]: https://github.com/FrozenProductions/Fumi/compare/app-v1.0.1...app-v1.0.2
[1.0.1]: https://github.com/FrozenProductions/Fumi/compare/app-v1.0.0...app-v1.0.1
[1.0.0]: https://github.com/FrozenProductions/Fumi/compare/11e1094a7a810aa68193ba48bffa17490dd50e9c...app-v1.0.0
[Keep a Changelog]: https://keepachangelog.com/en/1.1.0/
[Semantic Versioning]: https://semver.org/
