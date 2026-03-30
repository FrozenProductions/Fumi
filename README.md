<p align="center">
  <img src="resources/logo.png" alt="Fumi logo" width="220" />
</p>

<p align="center">
  <a href="https://github.com/FrozenProductions/Fumi/actions/workflows/ci.yml">
    <img src="https://github.com/FrozenProductions/Fumi/actions/workflows/ci.yml/badge.svg" alt="CI status" />
  </a>
  <img src="https://img.shields.io/badge/version-1.0.0-7f8c8d" alt="Version 1.0.0" />
  <a href="./LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-2f855a" alt="MIT License" />
  </a>
</p>

# Fumi

Fumi is an Elegant custom api wrapper interface for the MacSploit API.

This README is based on the public repository structure and config files such as [package.json](./package.json), [src-tauri/tauri.conf.json](./src-tauri/tauri.conf.json), and [.github/workflows/ci.yml](./.github/workflows/ci.yml).

## Key Features

- Open a local workspace folder and restore its previous session state
- Create, edit, rename, reorder, archive, restore, and delete workspace script tabs
- Edit Luau files in a dedicated workspace editor with completion support
- Browse and search a remote script library powered by Rscripts.net
- Copy script links or full script contents to the clipboard
- Import script-library entries directly into the active workspace
- Attach to a local MacSploit socket and execute the active workspace tab
- Use native desktop menus, dialogs, zoom actions, and clipboard integrations through Tauri

## Technology Stack

Primary stack information comes from [package.json](./package.json) and [src-tauri/tauri.conf.json](./src-tauri/tauri.conf.json).

| Layer                     | Technology                | Version             |
| ------------------------- | ------------------------- | ------------------- |
| Runtime / package manager | Bun                       | `1.3.10+`           |
| Desktop shell             | Tauri                     | `v2`                |
| Native backend            | Rust                      | `1.85.0+`           |
| Frontend                  | React                     | `19.2.4`            |
| Frontend runtime          | React DOM                 | `19.2.4`            |
| Build tool                | Vite                      | `8.0.0`             |
| Language                  | TypeScript                | `6.0.2`             |
| Styling                   | Tailwind CSS              | `3.4.16`            |
| Formatting / linting      | Biome                     | `2.0.6`             |
| State management          | Zustand                   | `5.0.12`            |
| Editor                    | Ace / React Ace           | `1.43.4` / `14.0.1` |
| Icons                     | Hugeicons                 | `4.0.0` / `1.1.6`   |
| Tauri plugins             | Clipboard Manager, Dialog | `v2`                |

## Project Architecture

Fumi is split into a React frontend and a Rust/Tauri backend:

- The React app in [`src/`](./src) renders the desktop UI, workspace editor, settings, command palette, and script library screens.
- Frontend access to native capabilities is funneled through wrappers in [`src/lib/platform`](./src/lib/platform) instead of calling raw Tauri APIs throughout the component tree.
- The Rust backend in [`src-tauri/src`](./src-tauri/src) registers Tauri commands, menu events, lifecycle hooks, workspace persistence, and MacSploit executor behavior.
- The script library is fetched by the frontend, while local workspace operations and executor actions go through the native backend.

```mermaid
flowchart LR
    UI["React UI<br/>src/mainview + src/components"] --> Platform["Platform Wrappers<br/>src/lib/platform"]
    UI --> Library["Rscripts.net API"]
    Platform --> Tauri["Tauri Commands & Events"]
    Tauri --> Backend["Rust Backend<br/>src-tauri/src"]
    Backend --> Files["Workspace Files & Metadata"]
    Backend --> Native["Native Menu / Dialog / Clipboard"]
    Backend --> Socket["MacSploit TCP Socket"]
```

### Main Runtime Areas

- [`src/mainview/App.tsx`](./src/mainview/App.tsx) composes the app shell, sidebar, topbar, settings window, and command palette.
- [`src/mainview/appScreens.tsx`](./src/mainview/appScreens.tsx) switches between the workspace and script-library screens.
- [`src-tauri/src/lib.rs`](./src-tauri/src/lib.rs) wires commands, plugins, menu handling, and guarded app/window shutdown.
- [`src-tauri/src/workspace`](./src-tauri/src/workspace) owns workspace metadata, file operations, and session restore behavior.
- [`src-tauri/src/executor`](./src-tauri/src/executor) manages the MacSploit socket protocol, attach/detach flow, and execution messages.
- [`src-tauri/src/menu.rs`](./src-tauri/src/menu.rs) defines native app, edit, file, view, and window menus.

## Getting Started

### Prerequisites

- macOS
- Xcode Command Line Tools
- Node.js `20.19.0+`
- Bun `1.3.10+`
- Rust `1.85.0+`

### Installation

```bash
bun install
```

### Run In Development

Run the full desktop app:

```bash
bun run dev
```

This starts the Vite dev server and launches the Tauri shell against `http://localhost:5173`.

If you only need the frontend for UI work:

```bash
bun run dev:web
```

### Build

Build only the web assets:

```bash
bun run build:web
```

Build the desktop application bundle:

```bash
bun run build
```

### Available Scripts

```bash
bun run dev        # Start the Tauri desktop app in development
bun run dev:web    # Start only the Vite frontend
bun run build:web  # Build frontend assets
bun run build      # Build the Tauri desktop bundle
bun run test       # Run Rust tests
bun run typecheck  # Run TypeScript type checks
bun run lint       # Run Biome lint/format checks
bun run format     # Apply Biome formatting
```

### Desktop Shell vs Web-Only Mode

Works in `bun run dev:web`:

- Most React UI development
- Styling and layout work
- Script-library browsing over standard `fetch()`

Requires the Tauri desktop shell:

- Opening a workspace directory from the OS
- Reading and writing workspace files
- Persisting workspace state through Rust commands
- Native dialogs, menus, zoom events, and clipboard integration
- MacSploit attach and execute flows

## Project Structure

```text
.
|-- .github/
|   `-- workflows/         # CI workflow definitions
|-- resources/             # Branding assets and project-specific docs
|-- src/
|   |-- assets/            # Bundled frontend assets
|   |-- components/        # Reusable React UI by domain
|   |-- constants/         # Shared constants grouped by feature
|   |-- contexts/          # React providers
|   |-- hooks/             # Reusable hooks by domain
|   |-- lib/               # Helpers and frontend platform wrappers
|   |-- mainview/          # Frontend entrypoint and top-level app composition
|   |-- shared/            # Shared frontend-side contracts
|   `-- types/             # Shared TypeScript types
|-- src-tauri/
|   |-- capabilities/      # Tauri capability permissions
|   |-- icons/             # Desktop app icons
|   |-- src/               # Rust backend, commands, menu, events, state
|   `-- tauri.conf.json    # Tauri app, bundle, and dev/build configuration
|-- LICENSE
`-- package.json
```

## Development Workflow

The documented workflow is repo-driven rather than process-heavy:

- Install dependencies with `bun install`.
- Use `bun run dev` for full desktop development or `bun run dev:web` for frontend-only work.
- Keep Tauri API access behind wrappers in [`src/lib/platform`](./src/lib/platform).
- Update [`src-tauri/tauri.conf.json`](./src-tauri/tauri.conf.json) when app metadata, windows, permissions, or bundle settings change.
- Update [`src-tauri/capabilities`](./src-tauri/capabilities) when new frontend Tauri APIs need extra permissions.
- For runtime wiring or cross-process changes, run `bun run lint`, `bun run typecheck`, and `bun run build`.

### CI

The repository includes a macOS CI workflow in [.github/workflows/ci.yml](./.github/workflows/ci.yml) that runs on pushes to `main` and on pull requests. It performs:

- `bun install --frozen-lockfile`
- `bun run lint`
- `bun run typecheck`
- `bun run test`
- `bun run build:web`

### Release Automation

- GitHub Releases are published by [.github/workflows/publish.yml](./.github/workflows/publish.yml) when you push a tag matching `app-v*`, for example `app-v1.0.1`.
- The release workflow builds both macOS updater targets used by Fumi and uploads the signed updater artifacts, including `latest.json`, to the GitHub Release.
- The updater endpoint configured in [`src-tauri/tauri.conf.json`](./src-tauri/tauri.conf.json) reads from `https://github.com/FrozenProductions/Fumi/releases/latest/download/latest.json`.

### Updater Signing Setup

- A Tauri updater keypair has to exist before publishing releases.
- Store the private key contents in the GitHub secret `TAURI_SIGNING_PRIVATE_KEY`.
- Store the private key password in the GitHub secret `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`.
- The public key is committed in [`src-tauri/tauri.conf.json`](./src-tauri/tauri.conf.json) and is safe to share.

### Branching Strategy

No explicit branching strategy is documented in the repository files currently present. The existing workflow is centered on pull requests plus CI validation.

## Coding Standards

The current codebase follows these conventions:

- Use functional code and keep responsibilities small and explicit.
- Prefer strict TypeScript with precise types and `type` aliases over loose typing.
- Use `import type` for type-only imports.
- Keep React components focused on rendering and push side effects or subscriptions into hooks.
- Avoid derived state in `useEffect`; compute it inline when possible.
- Route frontend-native interactions through [`src/lib/platform`](./src/lib/platform) wrappers.
- Keep reusable constants, types, hooks, and components in their domain folders instead of catch-all files.
- Use Tailwind utilities and the repo’s `fumi` color palette for styling.
- Follow Biome formatting defaults: 4-space indentation and double quotes.

## Testing

The repository’s test entrypoint is currently Rust-focused:

- `bun run test` maps to `cargo test --manifest-path src-tauri/Cargo.toml`
- CI runs tests together with linting, typechecking, and a frontend production build

At the moment, there is no dedicated frontend unit test script in [package.json](./package.json). Frontend validation is covered by TypeScript checks, Biome checks, and `bun run build:web`.

## Contributing

If you want to contribute:

1. Install dependencies with `bun install`.
2. Follow the existing project structure and patterns already used in [`src/`](./src) and [`src-tauri/src`](./src-tauri/src).
3. Keep changes targeted and place new code in the appropriate domain folder.
4. Use the scripts in [package.json](./package.json) as the source of truth.
5. Run the relevant validation commands before opening a pull request:

```bash
bun run lint
bun run typecheck
bun run test
bun run build:web
```

For implementation patterns and naming conventions, follow the existing code in [`src/`](./src) and [`src-tauri/src`](./src-tauri/src).

## License

This project is licensed under the [MIT License](./LICENSE).
