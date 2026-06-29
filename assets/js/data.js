/* 汇墨集 —— 多人博客数据
   作者与文章集中在此文件管理；多人协作时各自追加即可。
   字段约定：
   - author.color 用 CSS 变量(如 var(--daiqing))，决定头像底色
   - article.coverText 为无封面图时的书法占位字
   - article.content 为正文 HTML(段落 / 标题 / 引用 / 代码)
*/
window.BLOG_DATA = {
  site: {
    name: "汇墨集",
    nameEn: "Inkwell Collective",
    sealText: "汇墨",
    tagline: "承古意 · 录新声",
    description: "一隅墨客的共耕之地。古意与新声，皆落于此。",
    weather: { city: "上海", lat: 31.2304, lon: 121.4737 },
    links: [
      { name: "GitHub 仓库", href: "https://github.com/Cmochance/moke" },
      { name: "认识墨客", href: "author.html" },
      { name: "关于本站", href: "about.html" }
    ]
  },
  authors: [
    {
      id: "lin", name: "林墨", avatar: "墨", initials: "Lin",
      role: "主笔 · 古典与排印",
      bio: "中文系出身，痴迷字距与呼吸感。相信每个铅字都有自己的脾气。",
      color: "var(--daiqing)"
    },
    {
      id: "su", name: "苏砚", avatar: "砚", initials: "Su",
      role: "工程 · Rust 与系统",
      bio: "白天写后端，夜里写编译器。能用 Rust 解决的事，绝不麻烦第二个进程。",
      color: "var(--cinnabar)"
    },
    {
      id: "ye", name: "叶青", avatar: "青", initials: "Ye",
      role: "插画 · ACG 与色彩",
      bio: "浮世绘与赛博朋克之间反复横跳，相信朱与青能讲完所有故事。",
      color: "var(--gold)"
    }
  ],
  articles: [
    {
      id: "type-spacing",
      title: "宣纸上的字距：思源宋体与中文排印的呼吸感",
      excerpt: "中文字符天生方正，但字与字之间并非铁板一块。从铅字时代的垫片，到屏幕上的 tracking，呼吸感才是中文排版的灵魂。",
      authorId: "lin",
      date: "2026-06-22",
      category: "排印",
      pinned: true,
      coverText: "字",
      tags: ["排印", "国风"],
      stats: { views: 412, likes: 38, comments: 9 },
      content: "<p>中文字符方正，然字距非铁板一块。</p><p>铅字时代，排字工以薄铜片调整间隙，一行之中何处疏、何处密，全凭手温与眼力。</p><blockquote>呼吸感，是留白在字与字之间的回声。</blockquote><p>及至屏幕，思源宋体以矢量重绘笔意，而 tracking 与 line-height，正是数字时代的「垫片」。</p>"
    },
    {
      id: "rust-ssg",
      title: "用 Rust 写一个静态站点生成器：从 tokenize 到 AST",
      excerpt: "把 Markdown 变成 HTML 听起来简单，但当你真的动手，才会遇到所有那些藏在空白与转义里的小恶魔。",
      authorId: "su",
      date: "2026-06-18",
      category: "技术",
      pinned: true,
      coverText: "码",
      tags: ["Rust", "工程"],
      stats: { views: 658, likes: 52, comments: 14 },
      content: "<p>把 Markdown 变成 HTML 听起来简单——直到你真的动手。</p><p>词法分析是第一道关。空白、转义、代码围栏，每一个都藏着小恶魔。用 Rust 的模式匹配写 tokenizer，既安全又快得离谱。</p><h2>从 token 到 AST</h2><p>token 是离散的，AST 是有结构的。递归下降解析器在这里刚好够用。</p><pre><code>fn parse_block(&amp;mut self) -&gt; Node { ... }</code></pre>"
    },
    {
      id: "vermilion-and-cyan",
      title: "朱与青：从浮世绘到赛博朋克的配色考",
      excerpt: "为什么相隔百年的两种美学，都把朱砂红与黛青放在了画面的对角？这不是巧合，而是人眼对补色的古老偏爱。",
      authorId: "ye",
      date: "2026-06-12",
      category: "设计",
      coverText: "朱",
      tags: ["ACG", "色彩"],
      stats: { views: 893, likes: 76, comments: 21 },
      content: "<p>浮世绘里，葛饰北斋用普鲁士蓝压住富士山，再点一抹朱红在云脚。</p><p>百年之后，赛博朋克用霓虹青铺满雨夜，又把朱红留给了招牌与血。</p><blockquote>补色不是对抗，而是张力。</blockquote><p>人眼对补色的偏爱，比任何一种风格都古老。</p>"
    },
    {
      id: "guqin-silence",
      title: "古琴里的留白：声音的负空间",
      excerpt: "西方乐谱记的是「该出声的地方」，古琴减字谱记的也是——但真正让它成为古琴的，是那些不出声的间隙。",
      authorId: "lin",
      date: "2026-06-05",
      category: "随笔",
      coverText: "琴",
      tags: ["国风", "随笔"],
      stats: { views: 276, likes: 31, comments: 7 },
      content: "<p>减字谱记的是指法，是「该出声的地方」。</p><p>但让一段琴曲成立的，从来是那些不出声的间隙——吟猱之间的余韵，绰注之后的静默。</p><p>设计与音乐相通：留白即负空间，是未画的山水。</p>"
    }
  ]
};
