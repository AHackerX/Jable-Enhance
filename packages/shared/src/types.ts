import type { CacheStorage } from "./cache";

/** 带链接的条目 */
export interface LinkedItem {
  name: string;
  url: string;
}

/** 通用选项：请求 + 样式注入 + 可选缓存 */
export interface EnhanceOptions {
  /** 请求函数 */
  fetch: (url: string) => Promise<string>;
  /** 注入 CSS 样式 */
  injectStyles: (css: string) => void;
  /** 可选的缓存存储（用于标签筛选缓存） */
  cache?: CacheStorage;
}

/** 功能控制器，供外部控制显隐 */
export interface FeatureController {
  setVisible: (visible: boolean) => void;
}

/** JavDB 作品信息 */
export interface JavdbInfo {
  /** 番号 */
  code: string;
  /** 标题 */
  title: string;
  /** 封面图 URL */
  coverUrl: string;
  /** JavDB 详情页 URL */
  detailUrl: string;
  /** 评分 */
  score: string;
  /** 发行日期 */
  releaseDate: string;
  /** 时长 */
  duration: string;
  /** 导演 */
  director: LinkedItem | null;
  /** 片商 */
  maker: LinkedItem | null;
  /** 发行商 */
  publisher: LinkedItem | null;
  /** 系列 */
  series: LinkedItem | null;
  /** 女优列表 */
  actresses: LinkedItem[];
  /** 男优列表 */
  actors: LinkedItem[];
  /** 类别标签 */
  tags: LinkedItem[];
}
