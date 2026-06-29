/* 汇墨集 —— 钤印入册（纯前端模拟认证）
   两套身份：骚人（访客，邮箱验证码注册）/ 墨客（作者，预发放引帖注册）。
   无后端：验证码前端生成并直接展示、引帖码前端预设、用户与登录态存 localStorage。
   依赖：DOM 中存在 #authSlot 锚点（由 app.js 渲染导航时注入）。
*/
(function () {
  "use strict";

  /* ---- 配置 ---- */
  // 墨客（作者）预发放引帖码：持帖方可注册为作者。注册后该帖作废。
  var AUTHOR_INVITES = ["MOHAN-2026", "INKWELL-07", "GUOFENG-9K"];
  var STORE_USERS = "moke_users";
  var STORE_SESSION = "moke_session";
  var VERIFY_TTL = 5 * 60 * 1000; // 验证码 5 分钟有效

  var pendingVerify = null; // { email, code, expire }

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function uid() { return "u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function readUsers() { try { return JSON.parse(localStorage.getItem(STORE_USERS) || "[]"); } catch (e) { return []; } }
  function writeUsers(u) { localStorage.setItem(STORE_USERS, JSON.stringify(u)); }
  function getSession() { try { return JSON.parse(localStorage.getItem(STORE_SESSION) || "null"); } catch (e) { return null; } }
  function setSession(s) { if (s) localStorage.setItem(STORE_SESSION, JSON.stringify(s)); else localStorage.removeItem(STORE_SESSION); }
  function now() { return new Date().toISOString(); }
  function sealChar(name) { return (name || "客").trim().charAt(0); }
  function isEmail(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s); }

  function findUserByEmail(email) {
    var us = readUsers();
    for (var i = 0; i < us.length; i++) if (us[i].email === email) return us[i];
    return null;
  }
  function inviteValid(code) { return AUTHOR_INVITES.indexOf(code) >= 0; }
  function inviteUsed(code) { return readUsers().some(function (u) { return u.role === "author" && u.invite === code; }); }
  function fmtDate(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    return d.getFullYear() + "." + String(d.getMonth() + 1).padStart(2, "0") + "." + String(d.getDate()).padStart(2, "0");
  }

  /* ---- 登录按钮：未登录「钤印」/ 已登录「印章+笔名」 ---- */
  function renderAuthButton() {
    var slot = $("#authSlot");
    if (!slot) return;
    var sess = getSession();
    if (sess) {
      slot.innerHTML =
        '<button class="nav__btn auth-btn auth-btn--in" id="authBtn" type="button">' +
          '<span class="auth-btn__seal" style="background:' + esc(sess.color) + '">' + esc(sealChar(sess.name)) + "</span>" +
          '<span class="auth-btn__name">' + esc(sess.name) + "</span>" +
        "</button>";
    } else {
      slot.innerHTML =
        '<button class="nav__btn auth-btn" id="authBtn" type="button" aria-label="钤印入册">' +
          '<svg class="auth-btn__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="1"/><path d="M9 9h6v6H9z"/></svg>' +
          "<span>钤印</span>" +
        "</button>";
    }
    var btn = $("#authBtn");
    if (btn) btn.addEventListener("click", sess ? openUserPanel : openAuthModal);
  }

  /* ---- 弹窗骨架 ---- */
  function openAuthModal() {
    ensureModal();
    var m = $("#authModal");
    m.classList.add("is-open");
    switchTab("visitor");
    document.body.style.overflow = "hidden";
  }
  function closeModal() {
    var m = $("#authModal");
    if (m) { m.classList.remove("is-open"); clearErrors(m); resetForms(m); }
    document.body.style.overflow = "";
  }
  function ensureModal() {
    if ($("#authModal")) return;
    var div = document.createElement("div");
    div.innerHTML = modalHTML();
 document.body.appendChild(div.firstElementChild);
    bindModal();
  }
  function switchTab(role) {
    $$("#authModal .auth-tab").forEach(function (t) {
      t.classList.toggle("is-active", t.getAttribute("data-role") === role);
    });
    $$("#authModal .auth-panel").forEach(function (p) {
      p.classList.toggle("is-active", p.getAttribute("data-role") === role);
    });
    clearErrors($("#authModal"));
  }
  function clearErrors(scope) { $$(".field-error", scope).forEach(function (e) { e.textContent = ""; }); }
  function resetForms(scope) { $$("input", scope).forEach(function (i) { i.value = ""; }); $("#verifyHint", scope) && ($("#verifyHint", scope).textContent = ""); }

  function modalHTML() {
    return (
      '<div class="auth-modal" id="authModal" aria-hidden="true">' +
        '<div class="auth-modal__backdrop" data-close></div>' +
        '<div class="auth-modal__card" role="dialog" aria-modal="true" aria-label="钤印入册">' +
          '<button class="auth-modal__close" data-close type="button" aria-label="关闭">×</button>' +
          '<div class="auth-modal__head">' +
            '<span class="auth-modal__seal is-seal">入册</span>' +
            "<h2>钤印入册</h2>" +
            '<p class="auth-modal__sub">钤一方印，落一处名。择身份而入。</p>' +
          "</div>" +
          '<div class="auth-tabs">' +
            '<button class="auth-tab is-active" data-role="visitor" type="button"><span class="auth-tab__cn">骚人</span><span class="auth-tab__desc">访客</span></button>' +
            '<button class="auth-tab" data-role="author" type="button"><span class="auth-tab__cn">墨客</span><span class="auth-tab__desc">作者</span></button>' +
          "</div>" +

          /* ---- 骚人（访客）：邮箱 + 验证码 ---- */
          '<div class="auth-panel is-active" data-role="visitor">' +
            '<p class="auth-note">以鸿雁传书，验信而入。新客亦由此册入。</p>' +
            '<label class="field"><span class="field__label">邮箱（鸿雁）</span>' +
              '<input type="email" id="vEmail" placeholder="you@example.com" autocomplete="email"></label>' +
            '<span class="field-error" id="vEmailErr"></span>' +
            '<div class="field field--row">' +
              '<label class="field__inline"><span class="field__label">朱签（验证码）</span>' +
                '<input type="text" id="vCode" placeholder="六位朱签" inputmode="numeric" maxlength="6"></label>' +
              '<button class="btn btn--ghost field__action" id="vSend" type="button">寄送朱签</button>' +
            "</div>" +
            '<span class="field-error" id="vCodeErr"></span>' +
            '<p class="verify-hint" id="verifyHint"></p>' +
            '<button class="btn btn--primary auth-submit" id="vSubmit" type="button">钤印入册</button>' +
          "</div>" +

          /* ---- 墨客（作者）：引帖 + 笔名 ---- */
          '<div class="auth-panel" data-role="author">' +
            '<p class="auth-note">墨客需持预发引帖方可入册。引帖一码一用，注册即作废。</p>' +
            '<label class="field"><span class="field__label">引帖（邀请码）</span>' +
              '<input type="text" id="aInvite" placeholder="如 MOHAN-2026" autocomplete="off"></label>' +
            '<span class="field-error" id="aInviteErr"></span>' +
            '<label class="field"><span class="field__label">笔名（号）</span>' +
              '<input type="text" id="aName" placeholder="如 林墨" maxlength="12"></label>' +
            '<span class="field-error" id="aNameErr"></span>' +
            '<button class="btn btn--primary auth-submit" id="aSubmit" type="button">钤印入册</button>' +
          "</div>" +
        "</div>" +
      "</div>"
    );
  }
  function bindModal() {
    var m = $("#authModal");
    $$("[data-close]", m).forEach(function (e) { e.addEventListener("click", closeModal); });
    $$(".auth-tab", m).forEach(function (t) { t.addEventListener("click", function () { switchTab(t.getAttribute("data-role")); }); });
    $("#vSend", m).addEventListener("click", sendVisitorCode);
    $("#vSubmit", m).addEventListener("click", submitVisitor);
    $("#aSubmit", m).addEventListener("click", submitAuthor);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeModal(); });
  }

  /* ---- 骚人：寄送验证码（前端模拟） ---- */
  function sendVisitorCode() {
    var email = $("#vEmail").value.trim();
    var emailErr = $("#vEmailErr");
    emailErr.textContent = "";
    if (!isEmail(email)) { emailErr.textContent = "请填入有效的邮箱。"; return; }
    var code = String(Math.floor(100000 + Math.random() * 900000));
    pendingVerify = { email: email, code: code, expire: Date.now() + VERIFY_TTL };
    var hint = $("#verifyHint");
    hint.innerHTML = '朱签已寄往 <b>' + esc(email) + "</b>（前端模拟）：<span class=\"code-show\">" + esc(code) + "</span>，五分钟内填入下方即可。";
    var btn = $("#vSend");
    countdown(btn, 30);
  }
  function countdown(btn, n) {
    var orig = btn.dataset.orig || (btn.dataset.orig = btn.textContent);
    btn.disabled = true;
    btn.textContent = n + "s 后再寄";
    var t = setInterval(function () {
      n--;
      if (n <= 0) { clearInterval(t); btn.disabled = false; btn.textContent = orig; }
      else btn.textContent = n + "s 后再寄";
    }, 1000);
  }

  /* ---- 骚人：提交（注册或登录） ---- */
  function submitVisitor() {
    var email = $("#vEmail").value.trim();
    var code = $("#vCode").value.trim();
    clearErrors($("#authModal"));
    if (!isEmail(email)) { $("#vEmailErr").textContent = "请填入有效的邮箱。"; return; }
    if (!pendingVerify || pendingVerify.email !== email) { $("#vCodeErr").textContent = "请先寄送朱签。"; return; }
    if (Date.now() > pendingVerify.expire) { $("#vCodeErr").textContent = "朱签已过期，请重新寄送。"; return; }
    if (code !== pendingVerify.code) { $("#vCodeErr").textContent = "朱签不符。"; return; }

    var user = findUserByEmail(email);
    if (!user) {
      user = { id: uid(), role: "visitor", email: email, name: email.split("@")[0], seal: sealChar(email.split("@")[0]), color: "var(--daiqing)", createdAt: now() };
      var us = readUsers(); us.push(user); writeUsers(us);
    }
    login(user, "骚人");
  }

  /* ---- 墨客：引帖（邀请码）注册 ---- */
  function submitAuthor() {
    var code = $("#aInvite").value.trim().toUpperCase();
    var name = $("#aName").value.trim();
    clearErrors($("#authModal"));
    if (!code) { $("#aInviteErr").textContent = "请填入引帖码。"; return; }
    if (!inviteValid(code)) { $("#aInviteErr").textContent = "引帖无效，非本册所发。"; return; }
    if (inviteUsed(code)) { $("#aInviteErr").textContent = "此帖已用，不可重复入册。"; return; }
    if (!name) { $("#aNameErr").textContent = "请题笔名。"; return; }
    if (name.length < 2) { $("#aNameErr").textContent = "笔名至少两字。"; return; }

    var user = { id: uid(), role: "author", invite: code, name: name, seal: sealChar(name), color: "var(--cinnabar)", createdAt: now() };
    var us = readUsers(); us.push(user); writeUsers(us);
    login(user, "墨客");
  }

  /* ---- 登录成功 ---- */
  function login(user, label) {
    setSession({ id: user.id, role: user.role, name: user.name, seal: user.seal, color: user.color, since: user.createdAt });
    closeModal();
    renderAuthButton();
    toast("「" + esc(user.name) + "」已钤印入册，" + label + "身份。");
  }

  function toast(msg) {
    var t = document.createElement("div");
    t.className = "auth-toast";
    t.innerHTML = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add("is-show"); });
    setTimeout(function () { t.classList.remove("is-show"); setTimeout(function () { t.remove(); }, 300); }, 2600);
  }

  /* ---- 用户面板（已登录点按钮） ---- */
  function openUserPanel() {
    var sess = getSession();
    if (!sess) return;
    var roleName = sess.role === "author" ? "墨客 · 作者" : "骚人 · 访客";
    var div = document.createElement("div");
    div.innerHTML =
      '<div class="auth-modal is-open" id="userPanel" aria-hidden="true">' +
        '<div class="auth-modal__backdrop" data-close></div>' +
        '<div class="auth-modal__card auth-modal__card--panel" role="dialog" aria-modal="true">' +
          '<button class="auth-modal__close" data-close type="button" aria-label="关闭">×</button>' +
          '<div class="user-panel">' +
            '<span class="user-panel__seal" style="background:' + esc(sess.color) + '">' + esc(sess.seal) + "</span>" +
            '<h2 class="user-panel__name">' + esc(sess.name) + "</h2>" +
            '<p class="user-panel__role">' + roleName + "</p>" +
            '<p class="user-panel__since">入册于 ' + esc(fmtDate(sess.since)) + "</p>" +
            '<button class="btn btn--ghost user-panel__logout" id="logoutBtn" type="button">拂衣退席（登出）</button>' +
          "</div>" +
        "</div>" +
      "</div>";
    document.body.appendChild(div.firstElementChild);
    $$("[data-close]", $("#userPanel")).forEach(function (e) { e.addEventListener("click", function () { $("#userPanel").remove(); }); });
    $("#logoutBtn").addEventListener("click", logout);
    document.addEventListener("keydown", function esc2(e) { if (e.key === "Escape") { var p = $("#userPanel"); if (p) p.remove(); document.removeEventListener("keydown", esc2); } });
  }
  function logout() {
    setSession(null);
    var p = $("#userPanel"); if (p) p.remove();
    renderAuthButton();
    toast("已拂衣退席。");
  }

  /* ---- 初始化 ---- */
  function init() {
    renderAuthButton();
    // 导航由 app.js 渲染，若 auth.js 先执行，待导航就绪后再渲染按钮
    if (!$("#authSlot")) {
      var obs = new MutationObserver(function () { if ($("#authSlot")) { renderAuthButton(); obs.disconnect(); } });
      obs.observe(document.getElementById("nav") || document.body, { childList: true, subtree: true });
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
