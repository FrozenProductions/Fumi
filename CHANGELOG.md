# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog], and this project adheres to [Semantic Versioning].

## [Unreleased]

### Added

- Add streamer mode privacy masking across accounts, executor labels, Roblox process labels, and workspace actions.
- Add an editor word wrap setting.
- Refresh application icon assets.

### Changed

- Improve app resume coordination, workspace editor state churn, Luau outline analysis, tooltip rendering, tab bar scrolling, and Roblox shutdown batching.
- Rework workspace screen orchestration and split oversized accounts, workspace, command palette, Luau, app, UI, and store modules into domain-aligned files.
- Polish workspace actions, Roblox launch and kill affordances, workspace empty state layout, and workspace error banner dismissal.

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

[Unreleased]: https://github.com/FrozenProductions/Fumi/compare/app-v1.0.6...HEAD
[1.0.6]: https://github.com/FrozenProductions/Fumi/compare/app-v1.0.5...app-v1.0.6
[1.0.5]: https://github.com/FrozenProductions/Fumi/compare/app-v1.0.4...app-v1.0.5
[1.0.4]: https://github.com/FrozenProductions/Fumi/compare/app-v1.0.3...app-v1.0.4
[1.0.3]: https://github.com/FrozenProductions/Fumi/compare/app-v1.0.2...app-v1.0.3
[1.0.2]: https://github.com/FrozenProductions/Fumi/compare/app-v1.0.1...app-v1.0.2
[1.0.1]: https://github.com/FrozenProductions/Fumi/compare/app-v1.0.0...app-v1.0.1
[1.0.0]: https://github.com/FrozenProductions/Fumi/compare/11e1094a7a810aa68193ba48bffa17490dd50e9c...app-v1.0.0
[Keep a Changelog]: https://keepachangelog.com/en/1.1.0/
[Semantic Versioning]: https://semver.org/
