# Jable Enhance

<p align="center">
  <img src="packages/extension/src/assets/icon.png" alt="Jable Enhance" width="256" />
</p>

增强 Jable.tv 的使用体验。

## 功能

- 自动识别视频页番号
- 从 JavDB 获取作品详情（评分、日期、时长、导演、片商、演员、类别等）
- 左侧封面 + 右侧信息的面板布局
- 演员按性别分类显示
- 所有字段支持点击跳转到 JavDB 对应页面
- 百分比精度的星级评分渲染

## 项目结构

## 项目结构

```
├── packages/
│   ├── shared/                # 共享逻辑库
│   │   └── src/
│   │       ├── index.ts       # 统一导出
│   │       ├── bootstrap.ts   # 通用启动流程
│   │       ├── constants.ts   # 常量定义
│   │       ├── types.ts       # 类型定义
│   │       ├── jable.ts       # Jable.tv 番号提取
│   │       ├── javdb.ts       # JavDB 搜索与解析
│   │       ├── ui.ts          # 信息面板 HTML 渲染
│   │       └── styles.ts      # 面板 CSS 样式
│   ├── extension/             # 浏览器扩展（WXT + Svelte 5）
│   │   ├── src/
│   │   │   ├── assets/
│   │   │   │   └── icon.png   # 扩展图标（自动生成多尺寸）
│   │   │   └── entrypoints/
│   │   │       ├── background.ts   # Service Worker（代理跨域请求）
│   │   │       ├── content.ts      # Content Script（注入信息面板）
│   │   │       └── popup/          # 扩展弹窗 UI
│   │   ├── wxt.config.ts
│   │   └── svelte.config.js
│   └── userscript/            # 油猴脚本（vite-plugin-monkey）
│       ├── src/
│       │   └── main.ts        # 入口（GM_xmlhttpRequest 跨域）
│       └── vite.config.ts
├── dist/                      # 构建产物
│   ├── extension/chrome-mv3/  # 浏览器扩展
│   └── userscript/            # 油猴脚本
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.json
```技术栈

- pnpm workspace monorepo
- TypeScript
- Vite
- WXT（浏览器扩展框架）
- Svelte 5（扩展 popup UI）
- vite-plugin-monkey（油猴脚本构建）

## 开发

```bash
# 安装依赖
pnpm install

# 构建所有产物
pnpm build
```

构建产物输出到项目根目录 `dist/`：

- `dist/extension/chrome-mv3/` — 浏览器扩展
- `dist/userscript/jable-enhance.user.js` — 油猴脚本

## 作者

[AHackerX](https://github.com/AHackerX)

## 许可证

[MIT](./LICENSE)
