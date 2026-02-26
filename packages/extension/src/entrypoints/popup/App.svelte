<script lang="ts">
  import {
    APP_NAME,
    APP_VERSION,
    KEY_ENABLE_INFO_PANEL,
    KEY_ENABLE_TAG_FILTER,
    CACHE_PREFIX,
  } from "@jable-enhance/shared";

  let infoPanel = $state(true);
  let tagFilter = $state(true);
  let cacheCount = $state(0);
  let clearing = $state(false);

  /** 加载设置和缓存统计 */
  async function load() {
    const data = await browser.storage.local.get({
      [KEY_ENABLE_INFO_PANEL]: true,
      [KEY_ENABLE_TAG_FILTER]: true,
    });
    infoPanel = data[KEY_ENABLE_INFO_PANEL] as boolean;
    tagFilter = data[KEY_ENABLE_TAG_FILTER] as boolean;
    await refreshCacheCount();
  }

  async function refreshCacheCount() {
    const all = await browser.storage.local.get(null);
    cacheCount = Object.keys(all).filter((k) => k.startsWith(CACHE_PREFIX)).length;
  }

  async function toggle(key: string, value: boolean) {
    await browser.storage.local.set({ [key]: value });
  }

  async function clearCache() {
    clearing = true;
    const all = await browser.storage.local.get(null);
    const keys = Object.keys(all).filter((k) => k.startsWith(CACHE_PREFIX));
    if (keys.length > 0) await browser.storage.local.remove(keys);
    cacheCount = 0;
    clearing = false;
  }

  load();
</script>

<main>
  <h1>{APP_NAME}</h1>
  <p class="version">v{APP_VERSION}</p>

  <section>
    <h2>功能开关</h2>
    <label class="toggle-row">
      <span>JavDB 信息面板</span>
      <input
        type="checkbox"
        bind:checked={infoPanel}
        onchange={() => toggle(KEY_ENABLE_INFO_PANEL, infoPanel)}
      />
    </label>
    <label class="toggle-row">
      <span>标签筛选</span>
      <input
        type="checkbox"
        bind:checked={tagFilter}
        onchange={() => toggle(KEY_ENABLE_TAG_FILTER, tagFilter)}
      />
    </label>
    <p class="hint">开关实时生效，无需刷新页面</p>
  </section>

  <section>
    <h2>缓存管理</h2>
    <div class="cache-row">
      <span>已缓存 {cacheCount} 个视频标签</span>
      <button onclick={clearCache} disabled={clearing || cacheCount === 0}>
        {clearing ? "清除中..." : "清除缓存"}
      </button>
    </div>
  </section>
</main>
