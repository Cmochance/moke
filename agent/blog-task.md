# 多人国风 Blog 搭建任务

## 目标 / Objective

搭建一个多人协作博客网站：
- 页面结构、框架、内容参考 https://kirigaya.cn/home （汇尘轩 · 锦恢的博客）
- 样式风格、组件复用本地 mochan-ai/guofeng-site 的国风（中式）设计系统

## 参考提取 / Reference Findings

### kirigaya.cn/home —— 结构 / 框架 / 内容
- 中式风格 SPA 博客；首页 = 固定导航栏 + 居中单列文章卡片流 + 页脚（无侧边栏）。
- 导航栏：印章式 Logo + 多级菜单 + 全局搜索(Cmd+K) + 订阅入口 + 明暗主题切换 + 登录。
- 文章卡片：封面图 + 标题(h2) + 摘要 + 发布时间 + 阅读/点赞/评论统计 + 分类标签。
- 配色米白(#FAF8F3) + 黛青 + 朱砂，与 mochan-ai 国风同源。

### mochan-ai/guofeng-site —— 样式 / 组件
- 配色 token：宣纸米白 #f7f2e9 / 墨黑 #1f1b18 / 朱砂红 #9e2b25 / 黛青 #2c4a52 / 金棕 #c0a062。
- 字体：思源宋体 Noto Serif SC(正文) + 马善政 Ma Shan Zheng(仅 logo / 首屏主标题)。
- 设计 token：模块化字号(1.25 大三度)、8px 间距系统、阴影 / 圆角 / 缓动 / 最大宽 1200px。
- 组件：回纹雷纹 SVG 边饰、宣纸质感多层渐变背景、印章 logo 体系(钤印斑驳)。
- 交互：滚动渐入 reveal、数字滚动 count-up、锚点高亮 scrollspy、移动端折叠菜单。

## 技术选型 / Tech Stack

纯静态自包含：HTML + 外链 CSS + 原生 JS；文章以结构化 JS 数据(data.js)管理，多位作者各加各的。
部署：GitHub Pages(与 guofeng-site 一致)。后续若需 Markdown 写作可平滑迁移到 VitePress/Astro。

## 目录结构 / Structure

- index.html —— 首页（导航 + hero + 文章卡片流 + 页脚）
- article.html —— 文章详情页
- author.html —— 作者主页（按作者筛选的文章列表）
- about.html —— 关于（团队 / 多人介绍）
- assets/css/style.css —— 国风设计系统 + Blog 组件样式
- assets/js/data.js —— 作者 + 文章数据
- assets/js/app.js —— 渲染 + 交互(reveal / count-up / 筛选 / 主题切换 / 移动菜单)
- agent/blog-task.md —— 本文件（任务活动文档）
- agent/project-rules.md —— 约束 / 决策

## 阶段清单 / Phases

- P1 项目骨架 + 国风设计系统 CSS（复用 guofeng token，新增 Blog 组件）
- P2 数据层：authors[] + articles[]（3 位示例作者 + 若干示例文章）
- P3 首页：固定导航 + hero + 单列文章卡片流 + 页脚
- P4 文章详情页：正文 drop-cap + 作者卡片 + 相关阅读
- P5 作者页 + 关于页（多人）
- P6 筛选（按作者/分类/标签）+ 搜索 + 明暗主题切换
- P7 响应式打磨 + 本地预览 + GitHub Pages 部署

## 当前状态 / Status

进行中 —— P1。
P1–P6 完成：首页 / 文章详情 / 关于页 / 筛选 / 搜索 / 明暗主题切换均可用。
已用 playwright 验证：4 篇卡片、8 个筛选标签、主题切换持久化、按作者筛选(苏砚→仅 1 篇)、重置恢复全部。
P7 完成：响应式三档断点打磨 + GitHub Pages 部署。
线上地址 https://cmochance.github.io/moke/ ，仓库 https://github.com/Cmochance/moke
已验证：首页/文章详情在子路径 /moke/ 下渲染正常；平板断点卡片封面 240→180px；正文阅读宽度 max-width 44rem。

## 验证 / Verification

cd /Users/alysechen/alysechen/github/Blog 然后 python3 -m http.server 8000 ，访问 http://localhost:8000

## 执行记录 / Log

- 2026-06-29：完成两边参考提取；创建任务文档；落地设计系统 CSS。
- 2026-06-29：落地 data.js / app.js / index.html / article.html / about.html。
- 2026-06-29：修复 app.js 中 renderHero 脱离 IIFE 的 bug($ 未定义)；playwright 验证三页渲染与交互通过；生成首页预览截图 preview/home-full.png。
- 2026-06-29：响应式增强（≤1024 平板断点、≤760 移动端间距/标题/网格优化）；部署 workflow + 远端仓库 moke 创建 + push 触发部署成功。

## 阻塞项 / 阻塞

- 示例作者与文章内容由占位数据填充，待用户提供真实内容替换。
