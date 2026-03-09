import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig(({ mode }) => {
  const isPlayable = mode === "playable";

  return {
    base: "./",
    plugins: isPlayable ? [viteSingleFile()] : [],
    define: isPlayable
      ? { "import.meta.env.VITE_PLAYABLE": "true" }
      : { "import.meta.env.VITE_PLAYABLE": "false" },
    build: isPlayable
      ? {
          outDir: "dist-playable",
          assetsInlineLimit: 100000000, // inline everything
          cssCodeSplit: false,
          rollupOptions: {
            output: {
              manualChunks: undefined, // no code splitting
              inlineDynamicImports: true,
            },
          },
        }
      : {
          outDir: "dist",
        },
  };
});
