import type { JavdbInfo, LinkedItem } from "./types";

/** 渲染可点击链接或纯文本 */
function link(item: LinkedItem): string {
  if (item.url) {
    return `<a href="${item.url}" target="_blank" rel="noopener noreferrer" class="je-link">${item.name}</a>`;
  }
  return item.name;
}

/** 渲染 LinkedItem 列表，用顿号分隔 */
function linkList(items: LinkedItem[]): string {
  return items.map(link).join("、");
}

/** 渲染五星评分，按百分比精确填充每颗星 */
function renderStars(scoreText: string): string {
  const scoreMatch = scoreText.match(/([\d.]+)/);
  if (!scoreMatch) return scoreText;

  const score = parseFloat(scoreMatch[1]);
  const stars: string[] = [];

  for (let i = 1; i <= 5; i++) {
    const pct = Math.min(100, Math.max(0, (score - (i - 1)) * 100));
    stars.push(
      `<span class="je-star" style="background:linear-gradient(90deg,#f5c518 ${pct}%,#444 ${pct}%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;">★</span>`,
    );
  }

  const countMatch = scoreText.match(/(\d+)\s*人/);
  const countText = countMatch ? `(${countMatch[1]}人)` : "";

  return `<span class="je-stars">${stars.join("")}</span><span class="je-score-text">${score.toFixed(2)}分${countText}</span>`;
}


/** 单个 label-value 片段（用于组合行） */
function cell(label: string, value: string): string {
  return `<span class="je-cell"><span class="je-label">${label}</span><span class="je-value">${value}</span></span>`;
}

export function renderInfoPanel(info: JavdbInfo): string {
  const rows: string[] = [];

  const addRow = (label: string, value: string) => {
    if (value) {
      rows.push(`
        <div class="je-row">
          <span class="je-label">${label}</span>
          <span class="je-value">${value}</span>
        </div>`);
    }
  };

  // 番号 + 评分 同一行
  const codeHtml = `<a href="${info.detailUrl}" target="_blank" rel="noopener noreferrer" class="je-link">${info.code}</a>`;
  if (info.score) {
    rows.push(`
      <div class="je-row je-row-combined">
        ${cell("番号", codeHtml)}
        ${cell("评分", renderStars(info.score))}
      </div>`);
  } else {
    addRow("番号", codeHtml);
  }

  // 日期 + 时长 同一行
  if (info.releaseDate && info.duration) {
    rows.push(`
      <div class="je-row je-row-combined">
        ${cell("日期", info.releaseDate)}
        ${cell("时长", info.duration)}
      </div>`);
  } else {
    addRow("日期", info.releaseDate);
    addRow("时长", info.duration);
  }

  if (info.director) addRow("导演", link(info.director));
  if (info.maker) addRow("片商", link(info.maker));
  if (info.publisher) addRow("发行", link(info.publisher));
  if (info.series) addRow("系列", link(info.series));

  if (info.actresses.length) addRow("女优", linkList(info.actresses));
  if (info.actors.length) addRow("男优", linkList(info.actors));

  if (info.tags.length) {
    rows.push(`
      <div class="je-row">
        <span class="je-label">类别</span>
        <span class="je-value je-tags">${info.tags.map((t) => `<a href="${t.url}" target="_blank" rel="noopener noreferrer" class="je-tag">${t.name}</a>`).join("")}</span>
      </div>`);
  }

  return `
    <div id="jable-enhance-panel" class="je-panel">
      <div class="je-header">
        <a href="${info.detailUrl}" target="_blank" rel="noopener noreferrer" class="je-title">
          JavDB 作品信息
        </a>
      </div>
      <div class="je-content">
        ${info.coverUrl ? `<img class="je-cover" src="${info.coverUrl}" alt="${info.code}" loading="lazy" />` : ""}
        <div class="je-body">${rows.join("")}</div>
      </div>
    </div>`;
}
