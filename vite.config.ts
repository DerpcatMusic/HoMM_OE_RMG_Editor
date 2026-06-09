import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  root: "src/ui",
  publicDir: "public",
  build: {
    outDir: "../../dist/ui",
    emptyOutDir: true,
  },
  plugins: [svelte()],
});
