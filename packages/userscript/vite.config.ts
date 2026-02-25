import { defineConfig } from "vite";
import monkey from "vite-plugin-monkey";

export default defineConfig({
  build: {
    outDir: "../../dist/userscript",
  },
  plugins: [
    monkey({
      entry: "src/main.ts",
      userscript: {
        name: "Jable Enhance",
        namespace: "https://github.com/AHackerX/jable-enhance",
        description: "增强 Jable.tv 的使用体验",
        author: "AHackerX",
        match: ["*://*.jable.tv/videos/*"],
        connect: ["javdb.com"],
        grant: [
          "GM_xmlhttpRequest",
          "GM_addStyle",
          "GM_getValue",
          "GM_setValue",
          "GM_deleteValue",
        ],
      },
      build: {
        fileName: "jable-enhance.user.js",
      },
    }),
  ],
});
