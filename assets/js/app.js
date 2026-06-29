/* 汇墨集 —— 渲染与交互
   依赖：先于本文件加载 data.js(window.BLOG_DATA)
   所有渲染基于 DOM 锚点(#nav / #hero / #filters / #feed 等)。
*/
(function () {
  "use strict";
  var DATA = window.BLOG_DATA || { site: {}, authors: [], articles: [] };
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  function findAuthor(id) {
    for (var i = 0; i < DATA.authors.length; i++) if (DATA.authors[i].id === id) return DATA.authors[i];
    return { name: "佚名", avatar: "?", color: "var(--ink-soft)" };
  }
  function fmtDate(d) {
    if (!d) return "";
    var p = String(d).split("-");
    return p[0] + "." + (p[1] || "") + "." + (p[2] || "");
  }
  function tagClass(t) {
    if (t === "国风" || t === "随笔") return "tag--gold";
    if (t === "Rust" || t === "工程" || t === "ACG" || t === "色彩") return "tag--teal";
    return "";
  }

  /* ---- 导航栏 ---- */
  function renderNav() {
    var box = $("#nav");
    if (!box) return;
    var s = DATA.site;
    var menu = [
      { t: "首页", href: "index.html", key: "home" },
      { t: "文章", href: "index.html#feed", key: "feed" },
      { t: "作者", href: "about.html", key: "authors" },
      { t: "关于", href: "about.html", key: "about" }
    ];
    var links = menu.map(function (m) {
      return '<a class="nav__link" data-nav="' + m.key + '" href="' + m.href + '">' + esc(m.t) + "</a>";
    }).join("");
    box.innerHTML =
      '<div class="nav__inner">' +
        '<a class="seal-logo" href="index.html">' +
          '<span class="seal-logo__box">' + esc(s.sealText) + "</span>" +
          '<span class="seal-logo__text"><span class="seal-logo__cn">' + esc(s.name) + "</span>" +
          '<span class="seal-logo__en">' + esc(s.nameEn) + "</span></span>" +
        "</a>" +
        '<nav class="nav__menu" id="navMenu">' + links + "</nav>" +
        '<div class="nav__actions">' +
          '<button class="nav__btn nav__btn--search" id="searchBtn" type="button">搜索 <kbd>K</kbd></button>' +
          '<button class="nav__btn" id="themeBtn" type="button" aria-label="切换主题">月</button>' +
          '<span id="authSlot"></span>' +
          '<button class="nav__btn nav__toggle" id="navToggle" type="button" aria-label="菜单">≡</button>' +
        "</div>" +
      "</div>";
    }

  /* ---- 文章卡片 ---- */
  function articleCardHTML(a) {
    var au = findAuthor(a.authorId);
    var tags = (a.tags || []).map(function (t) {
      return '<span class="tag ' + tagClass(t) + '">' + esc(t) + "</span>";
    }).join("");
    var cover = a.cover
      ? '<img src="' + esc(a.cover) + '" alt="">'
      : '<span class="article-card__cover-ph">' + esc(a.coverText || "墨") + "</span>";
    return (
      '<article class="article-card reveal" data-id="' + esc(a.id) + '">' +
        '<div class="article-card__cover">' + cover + "</div>" +
        '<div class="article-card__body">' +
          '<div class="cluster"><span class="tag tag--teal">' + esc(a.category) + "</span>" + tags + "</div>" +
          '<h2 class="article-card__title">' + esc(a.title) + "</h2>" +
          '<p class="article-card__excerpt">' + esc(a.excerpt) + "</p>" +
          '<div class="article-card__foot">' +
            '<span class="author-badge">' +
              '<span class="author-badge__avatar" style="background:' + esc(au.color) + '">' + esc(au.avatar) + "</span>" +
              '<span class="author-badge__name">' + esc(au.name) + "</span>" +
              '<span class="dot-sep"></span>' +
              '<span class="author-badge__date">' + esc(fmtDate(a.date)) + "</span>" +
            "</span>" +
            '<span class="stats">' +
              '<span class="stats__item">阅 ' + (a.stats ? a.stats.views : 0) + "</span>" +
              '<span class="stats__item">赞 ' + (a.stats ? a.stats.likes : 0) + "</span>" +
            "</span>" +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }

  function renderFeed(list) {
    var box = $("#feed");
    if (!box) return;
    if (!list.length) { box.innerHTML = '<p class="muted center">此处空空如也。</p>'; return; }
    box.innerHTML = '<div class="feed">' + list.map(articleCardHTML).join("") + "</div>";
    $$(".article-card", box).forEach(function (card) {
      card.addEventListener("click", function () {
        location.href = "article.html?id=" + encodeURIComponent(card.getAttribute("data-id"));
      });
    });
    initReveal();
  }

  /* ---- 筛选器（按分类 / 作者） ---- */
  function uniqueCategories() {
    var seen = {}, out = [];
    DATA.articles.forEach(function (a) { if (!seen[a.category]) { seen[a.category] = 1; out.push(a.category); } });
    return out;
  }
  function renderFilters() {
    var box = $("#filters");
    if (!box) return;
    var cats = ["全部"].concat(uniqueCategories());
    var chips = cats.map(function (c, i) {
      return '<button class="chip' + (i === 0 ? " is-active" : "") + '" data-cat="' + esc(c) + '">' + esc(c) + "</button>";
    }).join("");
    var auChips = DATA.authors.map(function (au) {
      return '<button class="chip" data-author="' + esc(au.id) + '">' + esc(au.name) + "</button>";
    }).join("");
    box.innerHTML = '<div class="filters">' + chips + auChips + "</div>";
    $$(".chip", box).forEach(function (chip) {
      chip.addEventListener("click", function () {
        $$(".chip", box).forEach(function (c) { c.classList.remove("is-active"); });
        chip.classList.add("is-active");
        applyFilter(chip);
      });
    });
  }
  function applyFilter(chip) {
    var cat = chip.getAttribute("data-cat");
    var aid = chip.getAttribute("data-author");
    var list = DATA.articles.filter(function (a) {
      if (aid) return a.authorId === aid;
      if (cat && cat !== "全部") return a.category === cat;
      return true;
    });
    renderFeed(list);
  }

  /* ---- 滚动渐入 reveal ---- */
  function initReveal() {
    var els = $$(".reveal:not(.is-visible)");
    if (!els.length) return;
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---- 明暗主题切换 ---- */
  function initTheme() {
    var btn = $("#themeBtn");
    var saved = localStorage.getItem("blogTheme");
    if (saved === "dark" || saved === "light") document.documentElement.setAttribute("data-theme", saved);
    if (btn) {
      btn.textContent = document.documentElement.getAttribute("data-theme") === "dark" ? "日" : "月";
      btn.addEventListener("click", function () {
        var cur = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", cur);
        localStorage.setItem("blogTheme", cur);
        btn.textContent = cur === "dark" ? "日" : "月";
      });
    }
  }

  /* ---- 导航交互：滚动阴影 / 移动菜单 / 搜索 ---- */
  function initNav() {
    var nav = $("#nav");
    var toggle = $("#navToggle");
    var menu = $("#navMenu");
    if (toggle && menu) toggle.addEventListener("click", function () { menu.classList.toggle("is-open"); });
    window.addEventListener("scroll", function () {
      if (nav) nav.classList.toggle("is-scrolled", window.scrollY > 8);
    }, { passive: true });
    var sb = $("#searchBtn");
    if (sb) sb.addEventListener("click", runSearch);
    window.addEventListener("keydown", function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); runSearch(); }
    });
  }
  function runSearch() {
    var box = $("#feed");
    if (!box) return;
    var q = window.prompt("搜索文章（标题 / 摘要 / 标签 / 分类）：");
    if (!q || !q.trim()) { resetFilters(); renderFeed(DATA.articles); return; }
    var k = q.trim().toLowerCase();
    var list = DATA.articles.filter(function (a) {
      var hay = (a.title + " " + a.excerpt + " " + (a.tags || []).join(" ") + " " + a.category).toLowerCase();
      return hay.indexOf(k) >= 0;
    });
    resetFilters();
    renderFeed(list);
    box.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function resetFilters() {
    $$("#filters .chip").forEach(function (c) {
      c.classList.toggle("is-active", c.getAttribute("data-cat") === "全部");
    });
  }

  /* ---- 文章详情页 ---- */
  function renderArticle() {
    var box = $("#article");
    if (!box) return;
    var id = (location.search.match(/[?&]id=([^&]+)/) || [])[1];
    id = id ? decodeURIComponent(id) : "";
    var a = null;
    for (var i = 0; i < DATA.articles.length; i++) if (DATA.articles[i].id === id) { a = DATA.articles[i]; break; }
    if (!a) { box.innerHTML = '<p class="muted center">未找到该文章。<a href="index.html">返回首页</a></p>'; return; }
    var au = findAuthor(a.authorId);
    var cover = a.cover ? '<div class="article__cover"><img src="' + esc(a.cover) + '" alt=""></div>' : "";
    document.title = a.title + " · " + DATA.site.name;
    box.innerHTML =
      '<div class="article__head">' +
        '<p class="eyebrow">' + esc(a.category) + "</p>" +
        '<h1 class="article__title">' + esc(a.title) + "</h1>" +
        '<p class="article__sub">' + esc(a.excerpt) + "</p>" +
        '<div class="article__meta">' +
          '<span class="author-badge">' +
            '<span class="author-badge__avatar" style="background:' + esc(au.color) + '">' + esc(au.avatar) + "</span>" +
            '<span class="author-badge__name">' + esc(au.name) + "</span>" +
            '<span class="dot-sep"></span><span class="author-badge__date">' + esc(fmtDate(a.date)) + "</span>" +
          "</span>" +
        "</div>" +
      "</div>" +
      cover +
      '<div class="article__prose">' + (a.content || "") + "</div>" +
      '<div class="author-card">' +
        '<span class="author-card__avatar" style="background:' + esc(au.color) + '">' + esc(au.avatar) + "</span>" +
        "<div><div class=\"author-card__name\">" + esc(au.name) + " · " + esc(au.role || "") + "</div>" +
        '<div class="author-card__bio">' + esc(au.bio || "") + "</div></div>" +
      "</div>";
  }

  /* ---- 关于页（作者列表） ---- */
  function renderAbout() {
    var box = $("#about");
    if (!box) return;
    var s = DATA.site;
    var cards = DATA.authors.map(function (au) {
      var n = DATA.articles.filter(function (a) { return a.authorId === au.id; }).length;
      return (
        '<div class="author-profile reveal">' +
          '<span class="author-profile__avatar" style="background:' + esc(au.color) + '">' + esc(au.avatar) + "</span>" +
          '<h2 class="author-profile__name">' + esc(au.name) + "</h2>" +
          '<p class="author-profile__role">' + esc(au.role || "") + "</p>" +
          '<p class="author-profile__bio">' + esc(au.bio || "") + "</p>" +
          '<p class="faint">已撰 ' + n + " 篇</p>" +
        "</div>"
      );
    }).join("");
    box.innerHTML =
      '<div class="sec-head reveal"><p class="sec-head__eyebrow">关于本站</p>' +
      '<h2 class="sec-head__title">' + esc(s.name) + "</h2>" +
      '<p class="sec-head__sub">' + esc(s.description) + "</p></div>" +
      '<div class="author-grid">' + cards + "</div>";
    initReveal();
  }

  /* ---- 初始化分发 ---- */
  function init() {
    var page = document.body.getAttribute("data-page") || "home";
    renderNav();
    if (page === "home") { renderHero(); renderFilters(); renderFeed(DATA.articles); }
    else if (page === "article") renderArticle();
    else if (page === "about") renderAbout();
    initReveal();
    initTheme();
    initNav();
    if (page) $$(".nav__link[data-nav]").forEach(function (l) {
      var k = l.getAttribute("data-nav");
      l.classList.toggle("is-active", k === page || (page === "about" && (k === "authors" || k === "about")));
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  /* ---- 首屏 hero ---- */
  function renderHero() {
    var box = $("#hero");
    if (!box) return;
    var s = DATA.site;
    box.innerHTML =
      '<p class="hero__eyebrow reveal">' + esc(s.tagline) + "</p>" +
      '<h1 class="hero__title reveal" data-delay="1">' + esc(s.name) + '<span class="dot"> · </span>共耕之地</h1>' +
      '<p class="hero__lead reveal" data-delay="2">' + esc(s.description) + "</p>" +
      '<div class="hero__actions reveal" data-delay="3">' +
        '<a class="btn btn--primary" href="#feed">读最新</a>' +
        '<a class="btn btn--ghost" href="about.html">认识墨客</a>' +
      "</div>";
  }
})();
