# Contributing to Fumi

This document is for people making changes to the repo. Read [README.md](./README.md) for product and architecture context.

## Before You Start

- Fumi is a Tauri v2 desktop app, not an Electron app. Do not introduce Electron APIs or Electron-specific patterns.
- The app currently targets macOS. If you cannot test on macOS, say that clearly in the pull request.
- Keep changes focused. Small, reviewable pull requests are easier to land than wide refactors.
- Search for existing issues and pull requests before starting duplicate work.

## Local Setup

Prerequisites:

- macOS
- Xcode Command Line Tools
- Node.js `>=20.19.0`
- Bun `>=1.3.10`
- Rust `1.88.0`

Install dependencies:

```bash
bun install
```

Start the desktop app:

```bash
bun run dev
```

Start only the frontend:

```bash
bun run dev:web
```

## Working In This Repo

Use the scripts in [package.json](./package.json) as the source of truth.

- `bun run lint`
- `bun run typecheck`
- `bun run test`
- `bun run build:web`
- `bun run build`

Follow the existing layout instead of creating generic dump files:

- `src/view/` for app composition and view entrypoints
- `src/components/` for reusable UI
- `src/hooks/` for reusable hooks
- `src/lib/` for domain logic and platform wrappers
- `src-tauri/` for Rust and native desktop wiring

Project-specific rules that matter in practice:

- Keep Tauri API usage behind `src/lib/platform/` wrappers instead of calling raw APIs throughout the UI.
- Keep shared contracts explicit and close to the domain that owns them.
- Avoid wide refactors unless they are required to solve the problem.
- Prefer named exports in shared and library code.
- Keep generated output out of commits unless the change explicitly requires it.

## Before Opening A Pull Request

Run the checks that match your change:

- Always run `bun run lint`
- Always run `bun run typecheck`
- Run `bun run test` for behavioral changes
- Run `bun run build:web` when you touch frontend build or runtime code
- Run `bun run build` when you change Tauri wiring, Rust commands, capabilities, packaging, or other cross-process behavior

If you skip a check because it does not apply or your environment cannot run it, say that in the PR.

## Pull Request Expectations

A good PR here usually includes:

- a short explanation of the problem
- a concise summary of what changed
- the commands you ran locally
- screenshots or recordings for visible UI changes
- notes about follow-up work, known gaps, or tradeoffs

Keep PRs easy to review:

- do not mix unrelated cleanup into feature or bugfix work
- do not rename or move files unless the change actually needs it
- call out risky areas such as workspace persistence, executor flows, account handling, and Tauri command changes

## Reporting Bugs And Requesting Features

Use the issue templates when possible.

- Bug reports should include clear reproduction steps and environment details.
- Feature requests should describe the problem first, then the proposed change.

## Questions

If the code and docs disagree, follow:

1. [package.json](./package.json)
2. config files and actual source
3. older prose docs
