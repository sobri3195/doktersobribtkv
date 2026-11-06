import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
  plugins: [
    react(),
    tailwind(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["icons/*.png"],
      manifest: {
        name: "NEXAM Academy",
        short_name: "NEXAM",
        description: "Belajar mandiri BTKV, LPDP, SIMAK UI",
        lang: "id",
        start_url: "/",
        display: "standalone",
        theme_color: "#173a63",
        background_color: "#f7f9fc",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/icons/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,json,woff2}"],
        maximumFileSizeToCacheInBytes: 5000000,
        navigateFallback: "/index.html",
      },
    }),
  ],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/tests/setup.ts"],
    exclude: ["node_modules/**", "e2e/**"],
  },
});
