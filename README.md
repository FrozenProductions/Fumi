<p align="center">
  <img src="/assets/logo.png" alt="Fumi logo" width="220" />
</p>

# Fumi

Fumi is a Tauri v2 desktop app built with Bun, React, Vite, TypeScript, Tailwind CSS, and Biome.

## Requirements

- Node.js `20.19+` for Vite 8
- Bun `1.3.10+` to run the repo scripts shown below

## Scripts

```bash
# Install dependencies
bun install

# Run the Tauri desktop app in development
bun run dev

# Run only the Vite dev server
bun run dev:web

# Build the web assets only
bun run build:web

# Build the desktop app bundle
bun run build

# Check formatting and lint rules
bun run lint

# Apply Biome formatting
bun run format
```

## Development Modes

`bun run dev` starts Tauri in development mode and launches the desktop shell against the Vite dev server.

`bun run dev:web` starts the Vite dev server on `http://localhost:5173`.

## Project Structure

```text
src/
|-- components/  # Reusable React UI
|-- contexts/    # React providers and contexts
|-- mainview/    # React entrypoint and view-specific code
|-- lib/         # Platform and non-UI helpers
`-- types/       # Shared TypeScript types

src-tauri/
`-- src/         # Native Tauri backend, commands, and menu wiring
```
