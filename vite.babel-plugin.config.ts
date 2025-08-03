import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  root: __dirname,
  base: "./",
  build: {
    outDir: "./dist",
    target: "node18",
    emptyOutDir: false,
    reportCompressedSize: false,
    minify: true,
    sourcemap: false,
    lib: {
      entry: resolve(__dirname, "babel-plugin/preview-babel-plugin.ts"),
      formats: ["es" as const, "cjs" as const],
      fileName: "preview-babel-plugin",
    },
    rollupOptions: {
      external: [/^node:.*$/, /^@babel\/.*$/],
    },
  },
});
