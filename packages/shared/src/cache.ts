import { CACHE_PREFIX } from "./constants";

/** 缓存存储接口 */
export interface CacheStorage {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
}

interface CacheEntry {
  tags: string[];
  /** 缓存时间戳（毫秒） */
  ts: number;
}

/** 默认缓存有效期：7 天 */
const DEFAULT_TTL = 7 * 24 * 60 * 60 * 1000;

/** 从缓存读取视频标签 */
export async function getCachedTags(
  storage: CacheStorage,
  url: string,
): Promise<string[] | null> {
  try {
    const raw = await storage.get(CACHE_PREFIX + url);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.ts > DEFAULT_TTL) return null;
    return entry.tags;
  } catch {
    return null;
  }
}

/** 将视频标签写入缓存 */
export async function setCachedTags(
  storage: CacheStorage,
  url: string,
  tags: string[],
): Promise<void> {
  try {
    const entry: CacheEntry = { tags, ts: Date.now() };
    await storage.set(CACHE_PREFIX + url, JSON.stringify(entry));
  } catch { /* 写入失败不影响功能 */ }
}
