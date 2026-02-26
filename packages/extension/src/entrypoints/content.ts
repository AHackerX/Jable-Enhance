import { bootstrap, bootstrapTagFilter, isListPage, sameFetch, type CacheStorage } from "@jable-enhance/shared";

async function fetchViaBackground(url: string): Promise<string> {
  const res = await browser.runtime.sendMessage({ type: "FETCH_URL", url });
  if (!res.ok) throw new Error(res.error);
  return res.html;
}

function injectStyles(css: string) {
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
}

/** 基于 chrome.storage.local 的缓存实现 */
const storageCache: CacheStorage = {
  get: (key) =>
    new Promise((resolve) => {
      browser.storage.local.get(key).then((result) => {
        resolve((result[key] as string) ?? null);
      });
    }),
  set: (key, value) =>
    new Promise((resolve) => {
      browser.storage.local.set({ [key]: value }).then(() => resolve());
    }),
};

export default defineContentScript({
  matches: ["*://*.jable.tv/*"],
  main: () => {
    if (isListPage()) {
      bootstrapTagFilter({ fetch: sameFetch, injectStyles, cache: storageCache });
    } else if (location.href.includes("/videos/")) {
      bootstrap({ fetch: fetchViaBackground, injectStyles });
    }
  },
});
