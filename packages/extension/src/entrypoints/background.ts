export default defineBackground(() => {
  browser.runtime.onMessage.addListener(
    (message: { type: string; url: string }, _sender, sendResponse) => {
      if (message.type === "FETCH_URL") {
        fetch(message.url)
          .then((res) => res.text())
          .then((html) => sendResponse({ ok: true, html }))
          .catch((err) => sendResponse({ ok: false, error: String(err) }));
        return true; // 保持 sendResponse 通道开启
      }
    },
  );
});
