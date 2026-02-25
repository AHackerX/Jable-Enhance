import { bootstrap } from "@jable-enhance/shared";

async function fetchViaBackground(url: string): Promise<string> {
  const res = await browser.runtime.sendMessage({ type: "FETCH_URL", url });
  if (!res.ok) throw new Error(res.error);
  return res.html;
}

export default defineContentScript({
  matches: ["*://*.jable.tv/videos/*"],
  main: () =>
    bootstrap({
      fetch: fetchViaBackground,
      injectStyles: (css) => {
        const style = document.createElement("style");
        style.textContent = css;
        document.head.appendChild(style);
      },
    }),
});
