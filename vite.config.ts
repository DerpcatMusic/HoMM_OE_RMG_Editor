import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  base: "/HoMM_OE_RMG_Editor/",
  root: "src/ui",
  publicDir: "public",
  build: {
    outDir: "../../dist/ui",
    emptyOutDir: true,
  },
  plugins: [svelte()],
});
