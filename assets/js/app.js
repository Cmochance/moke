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
      { t: "文章", href: "archive.html", key: "archive" },
      { t: "作者", href: "author.html", key: "authors" },
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

  /* ---- 首页侧边栏（天气 / 常用链接 / 置顶） ---- */
  function renderSidebar() {
    var box = $("#sidebar");
    if (!box) return;
    box.innerHTML =
      '<div class="side-block reveal" id="weatherCard"></div>' +
      '<div class="side-block reveal" id="linksBlock"></div>' +
      '<div class="side-block reveal" id="pinnedBlock"></div>';
    initReveal();
    renderWeather();
    renderLinks();
    renderPinned();
  }
  var WMO = {0:"晴",1:"大体晴",2:"多云",3:"阴",45:"雾",48:"雾凇",51:"毛毛雨",53:"小雨",55:"中雨",56:"冻雨",57:"冻雨",61:"小雨",63:"中雨",65:"大雨",66:"冻雨",67:"冻雨",71:"小雪",73:"中雪",75:"大雪",77:"霰",80:"阵雨",81:"阵雨",82:"暴雨",85:"阵雪",86:"阵雪",95:"雷暴",96:"雷暴夹冰雹",99:"雷暴夹冰雹"};
  function renderWeather() {
    var box = $("#weatherCard");
    if (!box || !DATA.site.weather) return;
    var w = DATA.site.weather;
    box.innerHTML = '<p class="side-block__title">天时 · ' + esc(w.city) + '</p><p class="muted">正在问天…</p>';
    var url = "https://api.open-meteo.com/v1/forecast?latitude=" + w.lat + "&longitude=" + w.lon + "&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto";
    fetch(url).then(function (r) { return r.json(); }).then(function (d) {
      var c = (d && d.current) || {};
      var desc = WMO[c.weather_code] != null ? WMO[c.weather_code] : "—";
      box.innerHTML =
        '<p class="side-block__title">天时 · ' + esc(w.city) + '</p>' +
        '<div class="weather"><span class="weather__temp">' + (c.temperature_2m != null ? c.temperature_2m + "°" : "—") + '</span><span class="weather__desc">' + esc(desc) + '</span></div>' +
        '<p class="weather__meta">体感 ' + (c.apparent_temperature != null ? c.apparent_temperature + "°" : "—") + ' · 湿度 ' + (c.relative_humidity_2m != null ? c.relative_humidity_2m + "%" : "—") + ' · 风 ' + (c.wind_speed_10m != null ? c.wind_speed_10m + " km/h" : "—") + '</p>';
    }).catch(function () {
      box.innerHTML = '<p class="side-block__title">天时 · ' + esc(w.city) + '</p><p class="muted">天象暂隐，改日再问。</p>';
    });
  }
  function renderLinks() {
    var box = $("#linksBlock");
    if (!box) return;
    var items = (DATA.site.links || []).map(function (l) {
      return '<a class="link-item" href="' + esc(l.href) + '"><span class="link-item__name">' + esc(l.name) + '</span></a>';
    }).join("");
    box.innerHTML = '<p class="side-block__title">常用</p><nav class="link-list">' + items + '</nav>';
  }
  function renderPinned() {
    var box = $("#pinnedBlock");
    if (!box) return;
    var list = DATA.articles.filter(function (a) { return a.pinned; });
    if (!list.length) list = DATA.articles.slice(0, 3);
    list = list.slice().sort(byDateDesc);
    var items = list.map(function (a) {
      return '<a class="pinned-item" href="article.html?id=' + encodeURIComponent(a.id) + '"><span class="pinned-item__title">' + esc(a.title) + '</span><span class="pinned-item__date">' + esc(fmtDate(a.date)) + '</span></a>';
    }).join("");
    box.innerHTML = '<p class="side-block__title">置顶</p><div class="pinned-list">' + items + '</div>';
  }
  function renderFeedLatest(n) {
    var list = DATA.articles.slice().sort(byDateDesc).slice(0, n || 10);
    renderFeed(list);
  }

  /* ---- 归档分页（文章清单页，每页 10 篇） ---- */
  var archive = { list: null, page: 1, size: 10 };
  function byDateDesc(a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; }
  function renderArchive() {
    var box = $("#feed-archive");
    if (!box) return;
    if (!archive.list) archive.list = DATA.articles.slice().sort(byDateDesc);
    var total = archive.list.length;
    var pages = Math.max(1, Math.ceil(total / archive.size));
    if (archive.page > pages) archive.page = pages;
    var start = (archive.page - 1) * archive.size;
    var slice = archive.list.slice(start, start + archive.size);
    if (!slice.length) { box.innerHTML = '<p class="muted center">此处空空如也。</p>'; renderPager(pages, 0); return; }
    box.innerHTML = '<div class="feed">' + slice.map(articleCardHTML).join("") + "</div>";
    $$(".article-card", box).forEach(function (card) {
      card.addEventListener("click", function () {
        location.href = "article.html?id=" + encodeURIComponent(card.getAttribute("data-id"));
      });
    });
    renderPager(pages, total);
    initReveal();
  }
  function renderPager(pages, total) {
    var box = $("#pager");
    if (!box) return;
    if (pages <= 1) { box.innerHTML = '<p class="pager__count">共 ' + total + ' 篇</p>'; return; }
    var html = '<button class="pager__btn" data-page="' + (archive.page - 1) + '"' + (archive.page === 1 ? " disabled" : "") + '>‹ 上一页</button>';
    for (var i = 1; i <= pages; i++) {
      html += '<button class="pager__num' + (i === archive.page ? " is-active" : "") + '" data-page="' + i + '">' + i + '</button>';
    }
    html += '<button class="pager__btn" data-page="' + (archive.page + 1) + '"' + (archive.page === pages ? " disabled" : "") + '>下一页 ›</button>';
    html += '<span class="pager__count">共 ' + total + ' 篇 · 第 ' + archive.page + " / " + pages + ' 页</span>';
    box.innerHTML = html;
    $$("#pager [data-page]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (b.disabled) return;
        archive.page = parseInt(b.getAttribute("data-page"), 10);
        renderArchive();
        var top = $("#archive"); if (top) top.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }
  function initArchiveFromQuery() {
    var q = (location.search.match(/[?&]q=([^&]+)/) || [])[1];
    if (q) {
      q = decodeURIComponent(q.replace(/\+/g, " ")).toLowerCase();
      archive.list = DATA.articles.filter(function (a) {
        var hay = (a.title + " " + a.excerpt + " " + (a.tags || []).join(" ") + " " + a.category).toLowerCase();
        return hay.indexOf(q) >= 0;
      }).sort(byDateDesc);
    } else {
      archive.list = DATA.articles.slice().sort(byDateDesc);
    }
    archive.page = 1;
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
    archive.list = list.sort(byDateDesc);
    archive.page = 1;
    renderArchive();
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
    var q = window.prompt("搜索文章（标题 / 摘要 / 标签 / 分类）：");
    if (q == null) return;
    if (!q.trim()) {
      archive.list = DATA.articles.slice().sort(byDateDesc);
      archive.page = 1;
      resetFilters();
      if ($("#feed-archive")) renderArchive();
      return;
    }
    var k = q.trim().toLowerCase();
    var list = DATA.articles.filter(function (a) {
      var hay = (a.title + " " + a.excerpt + " " + (a.tags || []).join(" ") + " " + a.category).toLowerCase();
      return hay.indexOf(k) >= 0;
    }).sort(byDateDesc);
    if (document.body.getAttribute("data-page") === "archive") {
      archive.list = list;
      archive.page = 1;
      resetFilters();
      renderArchive();
      var feedBox = $("#feed-archive");
      if (feedBox) feedBox.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      location.href = "archive.html?q=" + encodeURIComponent(q.trim());
    }
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

  /* ---- 作者列表页 ---- */
  function renderAuthors() {
    var box = $("#authors-list");
    if (!box) return;
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
    box.innerHTML = '<div class="author-grid">' + cards + "</div>";
    initReveal();
  }

  /* ---- 关于页（博客说明与声明） ---- */
  function renderAboutInfo() {
    var box = $("#about");
    if (!box) return;
    var s = DATA.site;
    box.innerHTML =
      '<div class="sec-head reveal"><p class="sec-head__eyebrow">关于本站</p>' +
      '<h2 class="sec-head__title">' + esc(s.name) + '</h2>' +
      '<p class="sec-head__sub">' + esc(s.description) + '</p></div>' +
      '<div class="prose-block reveal">' +
        '<h3>这方天地</h3>' +
        '<p>' + esc(s.name) + '（' + esc(s.nameEn) + '）是一隅多人共耕的博客。古意与新声，皆落于此：或谈字距排印，或记工程心得，或绘色彩与画面。诸位墨客各持己笔，不求整齐，但求真诚。</p>' +
        '<h3>版权与署名</h3>' +
        '<p>站内所有文章版权归各自作者所有。转载、引用请注明作者与原文链接；商用前请先征得作者同意。站点的国风视觉设计（配色、印章、回纹边饰）为本站原创，请勿整站照搬。</p>' +
        '<h3>免责声明</h3>' +
        '<p>文章内容为作者个人观点与经验记录，不构成任何专业建议。因参考本站内容而产生的任何后果，作者与本站不承担责任。外链内容版权与观点归原站所有。</p>' +
        '<h3>技术说明</h3>' +
        '<p>本站为纯静态站点，文章以结构化数据管理，托管于 GitHub Pages，崇尚轻量与长久。首页天气信息来自 Open-Meteo 开放接口。</p>' +
        '<h3>联系</h3>' +
        '<p>勘误、投稿或合作，可前往 <a href="https://github.com/Cmochance/moke">GitHub 仓库</a> 留言。</p>' +
      '</div>';
    initReveal();
  }

  /* ---- 初始化分发 ---- */
  function init() {
    var page = document.body.getAttribute("data-page") || "home";
    renderNav();
    if (page === "home") { renderSidebar(); renderFeedLatest(10); }
    else if (page === "archive") { renderFilters(); initArchiveFromQuery(); renderArchive(); }
    else if (page === "article") renderArticle();
    else if (page === "authors") renderAuthors();
    else if (page === "about") renderAboutInfo();
    initReveal();
    initTheme();
    initNav();
    if (page) $$(".nav__link[data-nav]").forEach(function (l) {
      var k = l.getAttribute("data-nav");
      l.classList.toggle("is-active", k === page);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

})();
