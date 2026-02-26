/**
 * 等待目标元素出现并且 DOM 稳定后返回
 * jable.tv 使用 KVS 框架，页面初始渲染后会通过 AJAX 重载内容
 */
export function waitForStable(
  selector: string,
  timeout = 10000,
  stableMs = 500,
): Promise<Element | null> {
  return new Promise((resolve) => {
    let timer: ReturnType<typeof setTimeout>;
    let settled = false;

    const tryResolve = () => {
      const el = document.querySelector(selector);
      if (!el) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        settled = true;
        observer.disconnect();
        resolve(el);
      }, stableMs);
    };

    const observer = new MutationObserver(() => {
      if (!settled) tryResolve();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      if (!settled) {
        settled = true;
        observer.disconnect();
        resolve(document.querySelector(selector));
      }
    }, timeout);

    tryResolve();
  });
}

/** 同源 fetch 请求封装 */
export async function sameFetch(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}
