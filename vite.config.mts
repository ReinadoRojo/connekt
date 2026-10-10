import { defineConfig } from "vite";
import { redwood } from "rwsdk/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import path from "path";

export default defineConfig({
  plugins: [
    cloudflare({
      viteEnvironment: { name: "worker" },
    }),
    redwood(),
  ],
  worker: {
    format: 'es',
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src')
    }
  }
});
