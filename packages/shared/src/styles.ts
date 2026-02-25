/** 信息面板的 CSS 样式 */
export const infoPanelStyles = `
  .je-panel {
    background: #1a1a2e;
    border: 1px solid #333;
    border-radius: 8px;
    padding: 20px;
    margin: 16px 0;
    color: #e0e0e0;
    font-family: system-ui, sans-serif;
    font-size: 16px;
    max-width: 100%;
  }
  .je-header {
    margin-bottom: 14px;
    padding-bottom: 10px;
    border-bottom: 1px solid #333;
  }
  .je-title {
    color: #7c8cf8;
    text-decoration: none;
    font-size: 18px;
    font-weight: 600;
  }
  .je-title:hover { text-decoration: underline; }
  .je-content {
    display: flex;
    gap: 20px;
    align-items: stretch;
  }
  .je-cover {
    flex-shrink: 0;
    width: 400px;
    object-fit: contain;
    border-radius: 4px;
  }
  .je-body {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 4px;
    flex: 1;
    min-width: 0;
  }
  .je-row { display: flex; gap: 10px; line-height: 1.8; }
  .je-row-combined {
    display: flex;
    gap: 0;
    line-height: 1.8;
    flex-wrap: nowrap;
  }
  .je-row-combined .je-cell {
    display: flex;
    gap: 10px;
    white-space: nowrap;
  }
  .je-row-combined .je-cell:first-child {
    width: 200px;
    flex-shrink: 0;
  }
  .je-label {
    flex-shrink: 0;
    width: 52px;
    color: #999;
    text-align: right;
  }
  .je-value { color: #ddd; }
  .je-stars { display: inline-flex; gap: 2px; }
  .je-star { font-size: 18px; display: inline-block; }
  .je-score-text {
    margin-left: 4px;
    color: #f5c518;
    font-size: 14px;
  }
  .je-link {
    color: #7c8cf8;
    text-decoration: none;
  }
  .je-link:hover { text-decoration: underline; }
  .je-tags { display: flex; flex-wrap: wrap; gap: 6px; }
  .je-tag {
    background: #2a2a4a;
    padding: 3px 10px;
    border-radius: 4px;
    font-size: 13px;
    color: #aaa;
    text-decoration: none;
  }
  .je-tag:hover {
    background: #3a3a5a;
    color: #ccc;
  }
  .je-loading {
    color: #999;
    padding: 12px;
    text-align: center;
  }
  .je-error {
    color: #e57373;
    padding: 12px;
    text-align: center;
  }
`;
