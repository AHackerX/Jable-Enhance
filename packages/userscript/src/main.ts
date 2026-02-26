import { bootstrap, bootstrapTagFilter, isListPage, sameFetch, type CacheStorage } from "@jable-enhance/shared";

function gmFetch(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      method: "GET",
      url,
      onload: (res) => {
        if (res.status >= 200 && res.status < 300) {
          resolve(res.responseText);
        } else {
          reject(new Error(`HTTP ${res.status}`));
        }
      },
      onerror: () => reject(new Error("网络请求失败")),
    });
  });
}

const injectStyles = (css: string) => GM_addStyle(css);

/** 基于 GM_getValue/GM_setValue 的缓存实现 */
const gmCache: CacheStorage = {
  get: async (key) => GM_getValue(key, null) as string | null,
  set: async (key, value) => GM_setValue(key, value),
};

if (isListPage()) {
  bootstrapTagFilter({ fetch: sameFetch, injectStyles, cache: gmCache });
} else if (location.href.includes("jable.tv/videos/")) {
  bootstrap({ fetch: gmFetch, injectStyles });
}
