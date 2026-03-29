import { readFileSync } from "node:fs";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { DEV_SERVER_PORT } from "./src/constants/window/mainView";

const host = process.env.TAURI_DEV_HOST;
const packageJson = JSON.parse(
    readFileSync(new URL("./package.json", import.meta.url), "utf-8"),
) as { version: string };

export default defineConfig({
    clearScreen: false,
    define: {
        __APP_VERSION__: JSON.stringify(packageJson.version),
    },
    plugins: [react()],
    root: "src/mainview",
    build: {
        outDir: "../../dist",
        emptyOutDir: true,
        target:
            process.env.TAURI_ENV_PLATFORM === "windows"
                ? "chrome105"
                : "safari13",
        minify: process.env.TAURI_ENV_DEBUG ? false : "esbuild",
        sourcemap: Boolean(process.env.TAURI_ENV_DEBUG),
    },
    server: {
        host: host || false,
        port: DEV_SERVER_PORT,
        strictPort: true,
        hmr: host
            ? {
                  protocol: "ws",
                  host,
                  port: 1421,
              }
            : undefined,
        watch: {
            ignored: ["**/src-tauri/**"],
        },
    },
    envPrefix: ["VITE_", "TAURI_ENV_*"],
});
