import { tagFilterStyles } from "./styles";
import { waitForStable } from "./dom";
import { getCachedTags, setCachedTags } from "./cache";
import type { EnhanceOptions, FeatureController } from "./types";

interface VideoCard {
  el: HTMLElement;
  url: string;
  tags: string[];
  loaded: boolean;
}

/** 判断当前页面是否为列表页 */
export function isListPage(): boolean {
  return /jable\.tv\/.*\b(categories|models|tags|favourites|search)\b/.test(
    location.href,
  );
}

/** 从视频详情页 HTML 中提取标签 */
function parseTagsFromDetail(html: string): string[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const tags: string[] = [];
  doc.querySelectorAll("h5.tags a").forEach((a) => {
    const text = a.textContent?.trim();
    if (text) tags.push(text);
  });
  return tags;
}

/** 获取容器内所有视频卡片 */
function getVideoCards(container: Element): VideoCard[] {
  const cards: VideoCard[] = [];
  container.querySelectorAll(".video-img-box").forEach((el) => {
    const a = el.querySelector("a[href*='/videos/']");
    const url = a?.getAttribute("href");
    if (url) {
      const wrapper = el.closest("[class*='col']") ?? el.parentElement ?? el;
      cards.push({
        el: wrapper as HTMLElement,
        url: url.startsWith("http") ? url : `${location.origin}${url}`,
        tags: [],
        loaded: false,
      });
    }
  });
  return cards;
}

/**
 * 解析 jable.tv 的 AJAX 分页参数
 * jable 使用 KVS 框架，分页按钮的 data-parameters 包含 AJAX 请求参数
 */
function getAjaxPagination(): { baseUrl: string; totalPages: number } | null {
  const pagination = document.querySelector(".pagination");
  if (!pagination) return null;

  // 找到包含视频列表的 block 容器
  const listBlock = document.querySelector("[id^='list_videos']");
  if (!listBlock) return null;

  const blockId = listBlock.id;

  // 从所有分页链接的 data-parameters 中提取最大 from 值和 sort_by
  let totalPages = 1;
  let sortBy = "";
  for (const link of pagination.querySelectorAll("a.page-link[data-parameters]")) {
    const params = link.getAttribute("data-parameters") ?? "";
    const fromMatch = params.match(/from:(\d+)/);
    if (fromMatch) {
      const page = parseInt(fromMatch[1]);
      if (page > totalPages) totalPages = page;
    }
    if (!sortBy) {
      const sortMatch = params.match(/sort_by:([^;]+)/);
      if (sortMatch) sortBy = sortMatch[1];
    }
  }
  if (totalPages <= 1) return null;

  const base = location.href.split("#")[0].split("?")[0];
  const baseUrl = sortBy
    ? `${base}?mode=async&function=get_block&block_id=${blockId}&sort_by=${sortBy}`
    : `${base}?mode=async&function=get_block&block_id=${blockId}`;

  return { baseUrl, totalPages };
}

/** 从 AJAX 响应 HTML 中提取视频卡片元素 */
function parseCardsFromHtml(html: string): { cardHtml: string; url: string }[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const results: { cardHtml: string; url: string }[] = [];
  doc.querySelectorAll(".video-img-box").forEach((el) => {
    const a = el.querySelector("a[href*='/videos/']");
    const href = a?.getAttribute("href");
    const wrapper = el.closest("[class*='col']") ?? el.parentElement ?? el;
    if (href && wrapper) {
      const url = href.startsWith("http") ? href : `${location.origin}${href}`;
      results.push({ cardHtml: wrapper.outerHTML, url });
    }
  });
  return results;
}

/** 并发请求，限制同时请求数 */
async function fetchConcurrent<T>(
  items: string[],
  fn: (url: string) => Promise<T>,
  concurrency = 4,
): Promise<T[]> {
  const results: T[] = [];
  let i = 0;
  async function next(): Promise<void> {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => next()));
  return results;
}

/**
 * 标签筛选功能主入口
 * 在列表页注入筛选面板，加载视频标签，支持按标签筛选
 * 返回筛选面板元素，供外部控制显隐
 */
export async function bootstrapTagFilter(opts: EnhanceOptions): Promise<FeatureController | null> {
  opts.injectStyles(tagFilterStyles);

  // 等待页面稳定，避免被 KVS 框架 AJAX 重载覆盖
  await waitForStable("[id^='list_videos'] .video-img-box, .container .video-img-box");

  // 找到视频列表容器
  const listBlock = document.querySelector("[id^='list_videos']");
  const videoContainer = listBlock?.querySelector(".row") ??
    document.querySelector(".container .row");
  if (!videoContainer) return null;
  const container = videoContainer as Element;

  // 收集当前页卡片
  const cards: VideoCard[] = getVideoCards(container);
  if (cards.length === 0) return null;
  /** 第一页原始卡片数量 */
  const firstPageCount = cards.length;

  // 获取分页信息
  const pagination = getAjaxPagination();

  // 创建筛选面板
  const panel = document.createElement("div");
  panel.id = "je-tag-filter";
  container.parentElement?.insertBefore(panel, container);

  // 状态
  const activeTags = new Set<string>();
  const allTags = new Map<string, number>(); // tag → 出现次数
  let loading = false;
  let allPagesLoaded = !pagination;
  /** 已插入的分界线元素 */
  const pageDividers: HTMLElement[] = [];

  /** 渲染筛选面板 */
  function render() {
    const sortedTags = [...allTags.entries()].sort((a, b) => b[1] - a[1]);
    const loadedCount = cards.filter((c) => c.loaded).length;
    const totalCount = cards.length;

    let html = `<div class="je-filter-header">
      <span class="je-filter-title">标签筛选</span>
      <span class="je-filter-status">已加载 ${loadedCount}/${totalCount} 个视频的标签</span>`;

    if (!allPagesLoaded && pagination) {
      html += `<button class="je-filter-load-all" ${loading ? "disabled" : ""}>
        ${loading ? "加载中..." : `加载全部 ${pagination.totalPages} 页`}
      </button>`;
    }

    if (activeTags.size > 0) {
      html += `<button class="je-filter-reset">重置筛选</button>`;
    }

    html += `</div>`;

    if (sortedTags.length > 0) {
      html += `<div class="je-filter-tags">`;
      for (const [tag, count] of sortedTags) {
        const active = activeTags.has(tag) ? " active" : "";
        html += `<span class="je-filter-tag${active}" data-tag="${tag}">${tag} (${count})</span>`;
      }
      html += `</div>`;
    }

    panel.innerHTML = html;

    // 绑定事件
    panel.querySelector(".je-filter-load-all")?.addEventListener("click", loadAllPages);
    panel.querySelector(".je-filter-reset")?.addEventListener("click", () => {
      activeTags.clear();
      applyFilter();
    });
    panel.querySelectorAll(".je-filter-tag").forEach((el) => {
      el.addEventListener("click", () => {
        const tag = el.getAttribute("data-tag")!;
        if (activeTags.has(tag)) activeTags.delete(tag);
        else activeTags.add(tag);
        applyFilter();
      });
    });
  }

  /** 应用筛选：显示/隐藏卡片和分界线 */
  function applyFilter() {
    const filtering = activeTags.size > 0;
    for (const card of cards) {
      if (!filtering) {
        card.el.style.display = "";
      } else {
        const match = [...activeTags].every((t) => card.tags.includes(t));
        card.el.style.display = match ? "" : "none";
      }
    }
    // 筛选时隐藏分界线，重置时恢复
    for (const div of pageDividers) {
      div.style.display = filtering ? "none" : "";
    }
    render();
  }

  /** 为卡片加载标签（优先读缓存），返回是否有缓存命中 */
  async function loadTags(batch: VideoCard[]): Promise<boolean> {
    const unloaded = batch.filter((c) => !c.loaded);
    if (unloaded.length === 0) return false;

    // 先尝试从缓存读取
    let cacheHit = false;
    const toFetch: VideoCard[] = [];
    if (opts.cache) {
      for (const card of unloaded) {
        const cached = await getCachedTags(opts.cache, card.url);
        if (cached) {
          cacheHit = true;
          card.tags = cached;
          card.loaded = true;
          for (const t of cached) allTags.set(t, (allTags.get(t) ?? 0) + 1);
        } else {
          toFetch.push(card);
        }
      }
    } else {
      toFetch.push(...unloaded);
    }

    // 未命中缓存的发起请求
    if (toFetch.length > 0) {
      const urls = toFetch.map((c) => c.url);
      const htmls = await fetchConcurrent(urls, opts.fetch);
      for (let i = 0; i < toFetch.length; i++) {
        const card = toFetch[i];
        try {
          const tags = parseTagsFromDetail(htmls[i]);
          card.tags = tags;
          for (const t of tags) allTags.set(t, (allTags.get(t) ?? 0) + 1);
          if (opts.cache) await setCachedTags(opts.cache, card.url, tags);
        } catch { /* 忽略单个失败 */ }
        card.loaded = true;
      }
    }

    render();
    return cacheHit;
  }

  /** 构建分界线 HTML：── « ‹ 1 2 [3] ... › | 第 X 页 ── */
  function buildDividerHtml(current: number, total: number): string {
    let html = `<nav class="je-page-nav">`;
    html += `<a class="je-page-nav-btn" href="#">«</a>`;
    if (current > 1) {
      const prev = current === 2 ? "#je-page-1" : `#je-page-${current - 1}`;
      html += `<a class="je-page-nav-btn" href="${prev}">‹</a>`;
    }
    for (let p = 1; p <= total; p++) {
      const target = p === 1 ? "#je-page-1" : `#je-page-${p}`;
      if (p === current) {
        html += `<span class="je-page-nav-btn active">${p}</span>`;
      } else {
        html += `<a class="je-page-nav-btn" href="${target}">${p}</a>`;
      }
    }
    if (current < total) {
      html += `<a class="je-page-nav-btn" href="#je-page-${current + 1}">›</a>`;
    }
    html += `<a class="je-page-nav-btn" href="#je-page-${total}">»</a>`;
    html += `</nav>`;
    html += `<span class="je-page-divider-sep">|</span>`;
    html += `<span class="je-page-divider-label">第 ${current} 页</span>`;
    return html;
  }

  /** 加载全部分页 */
  async function loadAllPages() {
    if (!pagination || loading || allPagesLoaded) return;
    loading = true;
    render();

    try {
      // 逐页获取额外卡片
      const pageUrls = Array.from(
        { length: pagination.totalPages - 1 },
        (_, i) => `${pagination.baseUrl}&from=${i + 2}`,
      );

      const pageHtmls = await fetchConcurrent(pageUrls, opts.fetch, 3);

      for (let pi = 0; pi < pageHtmls.length; pi++) {
        const html = pageHtmls[pi];
        const parsed = parseCardsFromHtml(html);

        // 在每页之前插入分界线（含页码跳转）
        const pageNum = pi + 2;
        const divider = document.createElement("div");
        divider.className = "je-page-divider";
        divider.id = `je-page-${pageNum}`;
        divider.innerHTML = buildDividerHtml(pageNum, pagination.totalPages);
        container.appendChild(divider);
        pageDividers.push(divider);

        for (const { cardHtml, url } of parsed) {
          // 避免重复
          if (cards.some((c) => c.url === url)) continue;
          // 将额外卡片插入 DOM
          const temp = document.createElement("div");
          temp.innerHTML = cardHtml;
          const el = temp.firstElementChild as HTMLElement;
          if (el) {
            container.appendChild(el);
            cards.push({ el, url, tags: [], loaded: false });
          }
        }
      }

      // 为第一页也添加带导航的分界线
      const firstDivider = document.createElement("div");
      firstDivider.className = "je-page-divider";
      firstDivider.id = "je-page-1";
      firstDivider.innerHTML = buildDividerHtml(1, pagination.totalPages);
      container.insertBefore(firstDivider, container.firstChild);
      pageDividers.push(firstDivider);

      allPagesLoaded = true;

      // 所有页已合并显示，删除原始分页元素
      document.querySelector(".pagination")?.closest("nav, .pagination_wrapper, ul.pagination")?.remove()
        ?? document.querySelector(".pagination")?.remove();
    } catch { /* 忽略分页加载失败 */ }

    loading = false;

    // 加载新卡片的标签
    await loadTags(cards.filter((c) => !c.loaded));
  }

  // 初始渲染
  render();

  // 加载当前页卡片的标签，若命中缓存则自动加载全部页面
  const hasCached = await loadTags(cards);
  if (hasCached) await loadAllPages();

  return {
    setVisible: (visible: boolean) => {
      panel.style.display = visible ? "" : "none";
      for (const div of pageDividers) div.style.display = visible ? "" : "none";
      // 额外加载的卡片（非第一页）
      for (let i = firstPageCount; i < cards.length; i++) {
        cards[i].el.style.display = visible ? "" : "none";
      }
    },
  };
}
