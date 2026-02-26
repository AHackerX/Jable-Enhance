import { extractCodeFromUrl, extractCodeFromDocument } from "./jable";
import { buildSearchUrl, parseSearchResult, parseDetailPage } from "./javdb";
import { renderInfoPanel } from "./ui";
import { infoPanelStyles } from "./styles";
import { waitForStable } from "./dom";
import type { EnhanceOptions, FeatureController } from "./types";

/**
 * 通用启动流程：提取番号 → 搜索 JavDB → 解析详情 → 渲染面板
 * 返回控制器，供外部控制显隐
 */
export async function bootstrap(opts: EnhanceOptions): Promise<FeatureController | null> {
  const code =
    extractCodeFromUrl(location.href) ?? extractCodeFromDocument(document);
  if (!code) return null;

  opts.injectStyles(infoPanelStyles);

  // 等待页面稳定后再查找目标元素，避免被 KVS 框架 AJAX 重载覆盖
  await waitForStable(".info-header, h4.mb-1");
  const target =
    document.querySelector(".info-header") ??
    document.querySelector("h4.mb-1")?.parentElement;
  if (!target) return null;

  const container = document.createElement("div");
  container.innerHTML = '<div class="je-loading">正在从 JavDB 获取作品信息...</div>';
  target.after(container);

  const ctrl: FeatureController = {
    setVisible: (v) => { container.style.display = v ? "" : "none"; },
  };

  try {
    const searchHtml = await opts.fetch(buildSearchUrl(code));
    const detailPath = parseSearchResult(searchHtml, code);
    if (!detailPath) {
      container.innerHTML = '<div class="je-error">未在 JavDB 找到该番号</div>';
      return ctrl;
    }

    const detailUrl = `https://javdb.com${detailPath}`;
    const detailHtml = await opts.fetch(detailUrl);
    const info = parseDetailPage(detailHtml, code);
    if (!info) {
      container.innerHTML = '<div class="je-error">解析 JavDB 详情页失败</div>';
      return ctrl;
    }

    if (!info.detailUrl) info.detailUrl = detailUrl;

    container.innerHTML = renderInfoPanel(info);
  } catch (err) {
    container.innerHTML = `<div class="je-error">获取 JavDB 信息失败: ${err instanceof Error ? err.message : String(err)}</div>`;
  }

  return ctrl;
}
