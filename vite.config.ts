import { defineConfig } from "vite";
import { resolve } from "path";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        app: resolve(__dirname, "app.html"),
        index: resolve(__dirname, "index.html"),
        privacypolicy: resolve(__dirname, "privacypolicy.html"),
        termsofservice: resolve(__dirname, "termsofservice.html"),
        twitch: resolve(__dirname, "twitch.html"),
        youtube: resolve(__dirname, "youtube.html"),
      },
      output: {
        manualChunks: {
          firebasecompat: ["firebase/compat/app"],
        },
      },
    },
  },
  plugins: [svelte()],
});
