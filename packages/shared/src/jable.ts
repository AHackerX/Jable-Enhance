/**
 * 从 jable.tv 视频页 URL 中提取番号
 * 例: https://jable.tv/videos/dass-851/ → DASS-851
 */
export function extractCodeFromUrl(url: string): string | null {
  const match = url.match(/jable\.tv\/videos\/([a-z0-9]+-[a-z0-9]+)/i);
  return match ? match[1].toUpperCase() : null;
}

/**
 * 从当前 jable.tv 页面 DOM 中提取番号（备用方案）
 * 页面标题通常以番号开头，如 "DASS-851 ..."
 */
export function extractCodeFromDocument(doc: Document): string | null {
  // 尝试从 h4 标题提取
  const titleEl = doc.querySelector("h4.mb-1");
  if (titleEl?.textContent) {
    const match = titleEl.textContent.match(/^([A-Z]+-\d+)/);
    if (match) return match[1];
  }
  // 尝试从 og:title meta 提取
  const ogTitle = doc
    .querySelector('meta[property="og:title"]')
    ?.getAttribute("content");
  if (ogTitle) {
    const match = ogTitle.match(/^([A-Z]+-\d+)/);
    if (match) return match[1];
  }
  return null;
}
