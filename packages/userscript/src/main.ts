import { bootstrap } from "@jable-enhance/shared";

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

if (location.href.match(/jable\.tv\/videos\//)) {
  bootstrap({
    fetch: gmFetch,
    injectStyles: (css) => GM_addStyle(css),
  });
}
