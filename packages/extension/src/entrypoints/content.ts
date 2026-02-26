import { bootstrap, bootstrapTagFilter, isListPage, sameFetch, KEY_ENABLE_INFO_PANEL, KEY_ENABLE_TAG_FILTER, type CacheStorage, type FeatureController } from "@jable-enhance/shared";

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
  main: async () => {
    let infoPanelCtrl: FeatureController | null = null;
    let tagFilterCtrl: FeatureController | null = null;
    let infoPanelReady = false;
    let tagFilterReady = false;

    const isVideo = location.href.includes("/videos/");
    const isList = isListPage();

    async function ensureInfoPanel() {
      if (infoPanelReady || !isVideo) return;
      infoPanelReady = true;
      infoPanelCtrl = await bootstrap({ fetch: fetchViaBackground, injectStyles });
    }

    async function ensureTagFilter() {
      if (tagFilterReady || !isList) return;
      tagFilterReady = true;
      tagFilterCtrl = await bootstrapTagFilter({ fetch: sameFetch, injectStyles, cache: storageCache });
    }

    const settings = await browser.storage.local.get({
      [KEY_ENABLE_INFO_PANEL]: true,
      [KEY_ENABLE_TAG_FILTER]: true,
    });

    if (settings[KEY_ENABLE_INFO_PANEL]) await ensureInfoPanel();
    if (settings[KEY_ENABLE_TAG_FILTER]) await ensureTagFilter();

    browser.storage.onChanged.addListener(async (changes, area) => {
      if (area !== "local") return;

      if (changes[KEY_ENABLE_INFO_PANEL]) {
        const enabled = changes[KEY_ENABLE_INFO_PANEL].newValue as boolean;
        if (enabled) await ensureInfoPanel();
        infoPanelCtrl?.setVisible(enabled);
      }

      if (changes[KEY_ENABLE_TAG_FILTER]) {
        const enabled = changes[KEY_ENABLE_TAG_FILTER].newValue as boolean;
        if (enabled) await ensureTagFilter();
        tagFilterCtrl?.setVisible(enabled);
      }
    });
  },
});
