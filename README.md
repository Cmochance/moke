# 汇墨集 · Inkwell Collective

一隅墨客的共耕之地。古意与新声，皆落于此。
多人协作的中文博客站点，纯静态自包含，部署于 GitHub Pages。

页面结构参考 [汇尘轩](https://kirigaya.cn/home)，样式与组件复用 [mochan-ai/guofeng-site](https://github.com/Cmochance/mochan-ai) 的国风（中式）设计系统。

## 特性

- 国风配色：宣纸米白 · 墨黑 · 朱砂红 · 黛青 · 金棕
- 思源宋体正文 + 马善政书法体（仅用于印章 Logo 与首屏主标题）
- 印章式 Logo、回纹雷纹边饰、宣纸质感背景
- 滚动渐入动效、数字统计、明暗主题切换、移动端折叠菜单
- 按分类 / 作者筛选，全文搜索（⌘K）
- 响应式三档断点（移动端 / 平板 / 桌面）

## 本地预览

```bash
python3 -m http.server 8000
```

浏览器打开 http://localhost:8000

## 多人协作

作者与文章集中管理于 `assets/js/data.js`：

- 新增作者：在 `authors` 数组追加一个对象（id、name、avatar、role、bio、color）
- 新增文章：在 `articles` 数组追加一条（关联 authorId，正文用 HTML）

每位作者各自维护自己的条目即可。

## 目录结构

- `index.html` —— 首页（导航、首屏、筛选器、文章卡片流）
- `article.html` —— 文章详情页（首字下沉、作者卡片）
- `about.html` —— 关于页（作者卡片网格）
- `assets/css/style.css` —— 国风设计系统
- `assets/js/data.js` —— 作者与文章数据
- `assets/js/app.js` —— 渲染与交互逻辑

## 部署

推送到 `main` 分支即自动部署至 GitHub Pages（见 `.github/workflows/deploy-pages.yml`）。
