import type { JavdbInfo, LinkedItem } from "./types";

const JAVDB_BASE = "https://javdb.com";

/** 构建 JavDB 搜索 URL */
export function buildSearchUrl(code: string): string {
  return `${JAVDB_BASE}/search?q=${encodeURIComponent(code)}&f=all`;
}

/**
 * 从 JavDB 搜索结果 HTML 中提取第一个匹配项的详情页路径
 */
export function parseSearchResult(html: string, code: string): string | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const items = doc.querySelectorAll(".movie-list .item a");
  const normalizedCode = code.toUpperCase();

  for (const item of items) {
    const idEl = item.querySelector(".video-title strong");
    if (idEl?.textContent?.trim().toUpperCase() === normalizedCode) {
      const href = item.getAttribute("href");
      if (href) return href;
    }
  }

  return null;
}

/** 从 a 标签提取 LinkedItem */
function parseLink(el: Element | null): LinkedItem | null {
  if (!el) return null;
  const a = el.querySelector("a");
  if (!a) {
    const text = el.textContent?.trim();
    return text ? { name: text, url: "" } : null;
  }
  return linkFromAnchor(a);
}

/** 从单个 <a> 提取 LinkedItem */
function linkFromAnchor(a: Element): LinkedItem | null {
  const name = a.textContent?.trim() ?? "";
  const href = a.getAttribute("href") ?? "";
  return name ? { name, url: href ? `${JAVDB_BASE}${href}` : "" } : null;
}

/** 从多个 a 标签提取 LinkedItem 列表 */
function parseLinks(el: Element | null): LinkedItem[] {
  if (!el) return [];
  return Array.from(el.querySelectorAll("a"))
    .map(linkFromAnchor)
    .filter((x): x is LinkedItem => x !== null);
}

/**
 * 从 JavDB 详情页 HTML 中解析作品信息
 */
export function parseDetailPage(html: string, code: string): JavdbInfo | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const title =
    doc.querySelector("h2.title.is-4 strong")?.textContent?.trim() ?? "";
  if (!title) return null;

  const coverUrl =
    doc.querySelector(".video-cover")?.getAttribute("src") ??
    doc.querySelector('meta[property="og:image"]')?.getAttribute("content") ??
    "";

  const detailUrl =
    doc.querySelector('meta[property="og:url"]')?.getAttribute("content") ?? "";

  const panels = doc.querySelectorAll(".movie-panel-info .panel-block");

  let releaseDate = "";
  let duration = "";
  let score = "";
  let director: LinkedItem | null = null;
  let maker: LinkedItem | null = null;
  let publisher: LinkedItem | null = null;
  let series: LinkedItem | null = null;
  const actresses: LinkedItem[] = [];
  const actors: LinkedItem[] = [];
  const tags: LinkedItem[] = [];

  for (const panel of panels) {
    const label = panel.querySelector("strong")?.textContent?.trim() ?? "";
    const valueEl = panel.querySelector(".value");
    const value = valueEl?.textContent?.trim() ?? "";

    if (label.includes("日期")) {
      releaseDate = value;
    } else if (label.includes("評分") || label.includes("评分")) {
      score = value;
    } else if (label.includes("時長") || label.includes("时长")) {
      duration = value;
    } else if (label.includes("導演") || label.includes("导演")) {
      director = parseLink(valueEl);
    } else if (label.includes("片商")) {
      maker = parseLink(valueEl);
    } else if (label.includes("發行") || label.includes("发行")) {
      publisher = parseLink(valueEl);
    } else if (label.includes("系列")) {
      series = parseLink(valueEl);
    } else if (label.includes("演員") || label.includes("演员")) {
      // javdb 结构: <a>演员名</a><strong class="symbol female">♀</strong>
      // 性别标记在 <a> 后面的 <strong class="symbol"> 上
      if (valueEl) {
        for (const a of valueEl.querySelectorAll("a")) {
          const item = linkFromAnchor(a);
          if (!item) continue;

          const nextEl = a.nextElementSibling;
          if (nextEl?.classList.contains("symbol") && nextEl.classList.contains("male")) {
            actors.push(item);
          } else {
            actresses.push(item);
          }
        }
      }
    } else if (label.includes("類別") || label.includes("类别")) {
      tags.push(...parseLinks(valueEl));
    }
  }

  return {
    code,
    title,
    coverUrl,
    detailUrl,
    score,
    releaseDate,
    duration,
    director,
    maker,
    publisher,
    series,
    actresses,
    actors,
    tags,
  };
}
