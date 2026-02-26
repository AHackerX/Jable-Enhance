import { defineConfig } from "wxt";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  srcDir: "src",
  outDir: "../../dist/extension",
  modules: ["@wxt-dev/auto-icons"],
  vite: () => ({
    plugins: [svelte()],
  }),
  manifest: {
    name: "Jable Enhance",
    description: "增强 Jable.tv 的使用体验",
    permissions: ["activeTab", "storage"],
    host_permissions: ["*://*.javdb.com/*"],
  },
});
