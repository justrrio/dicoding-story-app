import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { resolve } from "path";

export default defineConfig({
  root: ".",
  base: "/",
  publicDir: "public",
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
    },
  },
  server: {
    port: 3000,
    open: true,
    cors: true,
  },
  preview: {
    port: 3000,
    open: true,
  },
  optimizeDeps: {
    include: ["leaflet", "leaflet-control-geocoder", "idb"],
  },
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/*.svg", "manifest.json"],
      manifest: {
        name: "Dicoding Story App",
        short_name: "Story App",
        description:
          "Share your stories with the Dicoding community through photos and locations",
        theme_color: "#2c3e50",
        background_color: "#ecf0f1",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/icons/app-icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "/icons/icon-144x144.svg",
            sizes: "144x144",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
        shortcuts: [
          {
            name: "Add New Story",
            short_name: "Add Story",
            description: "Add a new story with photo and location",
            url: "/#/add",
            icons: [
              {
                src: "/icons/app-icon.svg",
                sizes: "any",
                type: "image/svg+xml",
              },
            ],
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,json}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/story-api\.dicoding\.dev\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },
    }),
  ],
});
