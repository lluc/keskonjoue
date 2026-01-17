import { defineConfig } from "vite";
import { VitePWA as pwa } from "vite-plugin-pwa";
import manifest from "./manifest.json";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    pwa({
      strategies: "injectManifest",
      srcDir: "",
      filename: "service-worker.js",
      manifest,
      registerType: 'autoUpdate'
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'abcjs': ['abcjs'],
          'mui': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
        }
      }
    }
  }
});
