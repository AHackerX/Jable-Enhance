import { bootstrap, bootstrapTagFilter, isListPage, sameFetch } from "@jable-enhance/shared";

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

export default defineContentScript({
  matches: ["*://*.jable.tv/*"],
  main: () => {
    if (isListPage()) {
      bootstrapTagFilter({ fetch: sameFetch, injectStyles });
    } else if (location.href.includes("/videos/")) {
      bootstrap({ fetch: fetchViaBackground, injectStyles });
    }
  },
});
