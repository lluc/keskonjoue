import { defineConfig } from "vite";
import { VitePWA as pwa } from "vite-plugin-pwa";
import manifest from "./manifest.json";
import react from "@vitejs/plugin-react";
import pkg from "./package.json";

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    pwa({
      strategies: "injectManifest",
      srcDir: "",
      filename: "service-worker.js",
      manifest,
      registerType: 'autoUpdate',
      injectManifest: {
        globPatterns: [
          '**/*.{js,css,html,svg,png,ico,woff,woff2}',
          'soundfonts/**/*.mp3'
        ]
      }
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
