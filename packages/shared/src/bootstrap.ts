import { extractCodeFromUrl, extractCodeFromDocument } from "./jable";
import { buildSearchUrl, parseSearchResult, parseDetailPage } from "./javdb";
import { renderInfoPanel } from "./ui";
import { infoPanelStyles } from "./styles";

export interface BootstrapOptions {
  /** 跨域请求函数 */
  fetch: (url: string) => Promise<string>;
  /** 注入 CSS 样式 */
  injectStyles: (css: string) => void;
}

/**
 * 通用启动流程：提取番号 → 搜索 JavDB → 解析详情 → 渲染面板
 */
export async function bootstrap(opts: BootstrapOptions): Promise<void> {
  const code =
    extractCodeFromUrl(location.href) ?? extractCodeFromDocument(document);
  if (!code) return;

  opts.injectStyles(infoPanelStyles);

  const target =
    document.querySelector(".info-header") ??
    document.querySelector("h4.mb-1")?.parentElement;
  if (!target) return;

  const container = document.createElement("div");
  container.innerHTML = '<div class="je-loading">正在从 JavDB 获取作品信息...</div>';
  target.after(container);

  try {
    const searchHtml = await opts.fetch(buildSearchUrl(code));
    const detailPath = parseSearchResult(searchHtml, code);
    if (!detailPath) {
      container.innerHTML = '<div class="je-error">未在 JavDB 找到该番号</div>';
      return;
    }

    const detailUrl = `https://javdb.com${detailPath}`;
    const detailHtml = await opts.fetch(detailUrl);
    const info = parseDetailPage(detailHtml, code);
    if (!info) {
      container.innerHTML = '<div class="je-error">解析 JavDB 详情页失败</div>';
      return;
    }

    if (!info.detailUrl) info.detailUrl = detailUrl;

    container.innerHTML = renderInfoPanel(info);
  } catch (err) {
    container.innerHTML = `<div class="je-error">获取 JavDB 信息失败: ${err instanceof Error ? err.message : String(err)}</div>`;
  }
}
