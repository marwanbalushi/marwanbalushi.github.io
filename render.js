/* محرّك عرض المدونة — كل شيء فيه يُقاد من config.json */
(function () {
  var R = document.documentElement, $ = function (i) { return document.getElementById(i); };
  var CFG = null, DATA = [], form = "all", door = null, query = "", shown = 0, EDIT = false, SC = 1;
  var arn = function (n) { return String(n).replace(/\d/g, function (d) { return "٠١٢٣٤٥٦٧٨٩"[d]; }); };
  function st(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function rd(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
  function att(s) { return esc(s).replace(/"/g, "&quot;"); }

  /* القطع لا يشطر رمزاً تعبيرياً نصفين — فنصفُ الرمز يُعطب encodeURIComponent */
  function cut(t, n) {
    var s = String(t).replace(/\n/g, " ");
    if (s.length <= n) return s;
    var c = s.slice(0, n), last = c.charCodeAt(c.length - 1);
    if (last >= 0xD800 && last <= 0xDBFF) c = c.slice(0, -1);
    return c;
  }

  /* يجرّد النصّ من التشكيل والتطويل ويوحّد صور الهمزة والتاء والياء،
     ليجد البحثُ «صلابة أرض» في «صلابةُ أرضٍ». يُستعمل للمقارنة فقط،
     والنصّ المعروض يبقى كما كُتب حرفاً بحرف. */
  var NORM = {};
  function norm(s) {
    return String(s)
      .replace(/[\u064B-\u0652\u0670\u0640]/g, "")
      .replace(/[\u0622\u0623\u0625\u0671]/g, "\u0627")
      .replace(/\u0649/g, "\u064A")
      .replace(/\u0626/g, "\u064A")
      .replace(/\u0624/g, "\u0648")
      .replace(/\u0629/g, "\u0647")
      .replace(/\s+/g, " ")
      .trim();
  }

  var OWNER = false, asReader = false;
  try { OWNER = !!(rd("ghtok") || rd("ghunlocked")); } catch (e) {}
  try { asReader = rd("asreader") === "1"; } catch (e) {}
  EDIT = OWNER && !asReader;

  function ownerUI() {
    $("compose").classList.toggle("hide", !EDIT);
    $("ctrl").classList.toggle("hide", !EDIT);
    $("owner").classList.toggle("hide", !OWNER);
    $("owner").querySelector("span").innerHTML = EDIT
      ? "أنت في <b>وضع المالك</b> — ترى أزرار التحرير والمسوّدات."
      : "أنت في <b>عرض القارئ</b> — هذا ما يراه الزائر تماماً.";
    $("asreader").textContent = EDIT ? "عرض القارئ" : "عودة لوضع المالك";
  }
  if (OWNER) {
    ownerUI();
    $("asreader").onclick = function () {
      asReader = !asReader; st("asreader", asReader ? "1" : "0");
      EDIT = OWNER && !asReader; ownerUI(); shown = 0; render(); route();
    };
  }

  /* ---------- الأيقونات ---------- */
  var IC = {
    long: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16M4 10h16M4 15h16M4 20h9"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
    pen:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
    x:    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.2 2H21l-6.6 7.5L22 22h-6.2l-4.8-6.3L5.4 22H2.6l7-8L2 2h6.3l4.4 5.8zM17 20.3h1.6L7.1 3.6H5.4z"/></svg>',
    wa:   '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20zm4.5-5.9c-.2-.1-1.4-.7-1.7-.8s-.4-.1-.5.1-.6.8-.7.9-.3.2-.5 0a6.5 6.5 0 0 1-3.2-2.8c-.2-.4.2-.4.6-1.2a.5.5 0 0 0 0-.4c0-.1-.5-1.3-.7-1.7s-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11 11 0 0 0 4.3 3.8c1.6.6 2.2.7 3 .6a2.5 2.5 0 0 0 1.7-1.2 2 2 0 0 0 .2-1.2c-.1-.1-.3-.2-.5-.3z"/></svg>',
    fb:   '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7h-2.5V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z"/></svg>',
    tg:   '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.9 4.3 18.7 19c-.2 1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.4-5 9.1-8.2c.4-.4-.1-.6-.6-.2L6.3 12.8 1.5 11.3c-1-.3-1-1 .2-1.5l18.9-7.3c.9-.3 1.6.2 1.3 1.8z"/></svg>',
    cp:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    up:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 15l-6-6-6 6"/></svg>',
    ok:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>'
  };

  /* ---------- تطبيق الإعدادات ---------- */
  function loadFonts(cfg) {
    var fams = [cfg.type.display, cfg.type.text].filter(function (v, i, a) { return v && a.indexOf(v) === i; });
    if (!fams.length) return;
    var url = "https://fonts.googleapis.com/css2?" +
      fams.map(function (f) { return "family=" + encodeURIComponent(f).replace(/%20/g, "+") + ":wght@400;700"; }).join("&") +
      "&display=swap";
    var l = document.createElement("link"); l.rel = "stylesheet"; l.href = url;
    document.head.appendChild(l);
  }

  function applyTheme(cfg) {
    var t = cfg.type, s = document.createElement("style"), L = cfg.theme.light, D = cfg.theme.dark;
    function vars(o) {
      return Object.keys(o).map(function (k) { return "--" + k + ":" + o[k]; }).join(";");
    }
    s.textContent =
      ":root{" + vars(L) + ";--sizeM:" + t.sizeMobile + "px;--sizeD:" + t.sizeDesktop + "px;" +
      "--lh:" + t.lineHeight + ";--measure:" + t.measure + "em;--dscale:" + (t.displayScale || 1) + ";" +
      '--display:"' + t.display + '",serif;--text:"' + t.text + '",serif}' +
      "[data-theme=dark]{" + vars(D) + "}" +
      /* أيقونات المشاركة في سطر التاريخ */
      ".shx{margin-inline-start:auto;display:inline-flex;align-items:center;gap:5px}" +
      ".shx a,.shx button{display:inline-flex;align-items:center;justify-content:center;" +
      "color:var(--muted);background:none;border:var(--rulew) solid var(--rule);" +
      "border-radius:5px;padding:5px;cursor:pointer;line-height:0}" +
      ".shx a:hover,.shx button:hover{color:var(--accent);border-color:var(--gold)}" +
      ".shx svg{width:1.15em;height:1.15em}" +
      ".pen.after-shx{margin-inline-start:7px}" +
      /* شارة النصّ الطويل — تميّز ما يحتاج فتحاً عمّا يكتفي بموضعه */
      ".mk{display:inline-flex;align-items:center;gap:5px;color:var(--gold);" +
      "border:var(--rulew) solid var(--gold);border-radius:4px;padding:1px 8px;" +
      "font-family:var(--display);font-size:.96em;line-height:1.7;white-space:nowrap}" +
      ".mk svg{width:1.02em;height:1.02em;flex:none}" +
      ".mk:hover{color:var(--accent);border-color:var(--accent)}" +
      ".seg .selbtn,#forms .selbtn{color:var(--gold)}" +
      ".seg .selbtn.on,#forms .selbtn.on{color:var(--accent)}" +
      ".creed{font-family:var(--display);font-size:calc(var(--body)*.9);line-height:2.15;" +
      "margin:15px 0 0;color:var(--muted)}" +
      /* سهما التنقّل */
      ".sup{position:fixed;inset-inline-end:14px;bottom:16px;z-index:40;display:none;" +
      "flex-direction:column;gap:7px}" +
      ".sup button{width:38px;height:38px;display:flex;align-items:center;justify-content:center;" +
      "padding:0;cursor:pointer;border-radius:50%;color:var(--muted);background:var(--paper2);" +
      "border:var(--rulew) solid var(--rule);box-shadow:0 1px 5px rgba(0,0,0,.09);transition:opacity .2s}" +
      ".sup button:hover{color:var(--accent);border-color:var(--gold)}" +
      ".sup svg{width:19px;height:19px}" +
      "@media print{.sup{display:none!important}}";
    var rss = document.createElement("link");
    rss.rel = "alternate"; rss.type = "application/rss+xml";
    rss.title = cfg.site.name; rss.href = "rss.xml";
    document.head.appendChild(rss);
    document.head.appendChild(s);
    document.title = cfg.site.name;
    var tc = document.querySelector('meta[name="theme-color"]');
    if (tc) tc.setAttribute("content", L.accent);
  }

  function analytics(cfg) {
    var tok = cfg.analytics && cfg.analytics.cloudflareToken;
    if (!tok) return;
    var s = document.createElement("script");
    s.type = "module"; s.defer = true;
    s.src = "https://static.cloudflareinsights.com/beacon.min.js";
    s.setAttribute("data-cf-beacon", JSON.stringify({ token: tok }));
    document.body.appendChild(s);
  }

  /* ---------- لوحة القراءة ---------- */
  function mark() {
    document.querySelectorAll(".seg button").forEach(function (b) {
      if (b.dataset.a === "sc") return;
      b.classList.toggle("on", R.getAttribute("data-" + b.dataset.a) === b.dataset.v);
    });
  }
  function setAttr(a, v) {
    if (a === "sc") {
      SC = v === "up" ? Math.min(1.7, Math.round((SC + 0.1) * 10) / 10)
                      : Math.max(0.85, Math.round((SC - 0.1) * 10) / 10);
      R.style.setProperty("--scale", SC); st("scale", SC); return;
    }
    R.setAttribute("data-" + a, v); st(a, v); mark();
  }
  $("panel").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (b) setAttr(b.dataset.a, b.dataset.v);
  });
  $("gear").onclick = function () { $("panel").classList.toggle("on"); };
  (function () {
    var s = parseFloat(rd("scale")); if (s) { SC = s; R.style.setProperty("--scale", SC); }
    R.setAttribute("data-theme", rd("theme") ||
      (window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
    R.setAttribute("data-contrast", rd("contrast") || "normal");
    R.setAttribute("data-clarity", rd("clarity") || "normal");
    R.setAttribute("data-color", rd("color") || "full");
    mark();
  })();

  /* ---------- الترويسة والتذييل ---------- */
  function buildMast() {
    var s = CFG.site, h = '<h1 class="name"><a href="#/">' + esc(s.name) + "</a></h1>";
    if (s.showAvatar !== false && s.portrait) {
      h += '<a class="avlink" href="about.html" aria-label="' + esc(s.avatarCaption || "عن الكاتب") + '">' +
        '<img class="avatar" src="' + esc(s.portrait) + '" alt="' + esc(s.name) + '" ' +
        'style="width:' + (s.avatarSize || 66) + "px;height:" + (s.avatarSize || 66) + 'px" loading="lazy">' +
        '<span class="avcap">' + esc(s.avatarCaption || "عن الكاتب") + "</span></a>";
    }
    h += '<div class="fl" aria-hidden="true"><i></i><span class="lz"></span><i></i></div>' +
         '<p class="creed" id="doors"></p>' +
         '<p class="tag">' + esc(s.tagline) + "</p>";
    $("mast").innerHTML = h;

    /* سطرُ تعريفٍ يُقرأ ولا يُضغط — تحرّره من «الهوية» في اللوحة */
    $("doors").innerHTML = (CFG.doors || []).map(function (d) {
      return '<span class="subj">' + esc(d.subj) + "</span>" +
             (d.pred ? ' <span class="pred">' + esc(d.pred) + "</span>" : "");
    }).join(' <span class="sep">|</span> ');

    var fb = $("forms"); fb.innerHTML = "";
    Object.keys(CFG.forms).forEach(function (k) {
      fb.insertAdjacentHTML("beforeend",
        '<button data-f="' + k + '"' + (k === "all" ? ' class="on"' : "") + ">" + esc(CFG.forms[k]) + "</button>");
    });
    /* «مختارات» — تصفية بالثقل لا بالشكل، فتجلس بجانب أخواتها */
    fb.insertAdjacentHTML("beforeend",
      '<button data-f="sel" class="selbtn">' + esc(CFG.forms.selected || "مختارات") + "</button>");
    fb.querySelectorAll("button").forEach(function (b) {
      b.onclick = function () {
        location.hash = "#/"; form = b.dataset.f;
        fb.querySelectorAll("button").forEach(function (x) { x.classList.toggle("on", x === b); });
        shown = 0; render();
      };
    });

    $("q").placeholder = "ابحث في " + arn(DATA.length) + " نصّاً…";
    $("foot").innerHTML = '<div class="fl" aria-hidden="true"><i></i><span class="lz"></span><i></i></div>' +
      '<a href="archive.html" style="border-bottom:var(--rulew) solid var(--rule)">الأرشيف الزمني</a><br>' +
      esc(CFG.site.name) + (CFG.site.location ? " · " + esc(CFG.site.location) : "");
  }

  /* ---------- المداخل ---------- */
  function src(m) { return CFG.media.base ? CFG.media.base + "/" + m.f : m.u; }
  /* «٢١:٤٠» تصير «٩:٤٠ م» — تُعرض لمن سُجّلت ساعته وحده */
  function fmtTime(at) {
    if (!at || at.length < 16) return "";
    var hh = +at.slice(11, 13), mm = at.slice(14, 16);
    if (isNaN(hh)) return "";
    var ap = hh < 12 ? "ص" : "م", h = hh % 12; if (!h) h = 12;
    return arn(h) + ":" + arn(mm) + " " + ap;
  }

  function readTime(t) {
    var w = t.trim().split(/\s+/).length, m = Math.max(1, Math.round(w / 180));
    return arn(m) + " دقيقة قراءة";
  }
  function galleryClass(n) {
    var g = CFG.layout.gallery || "grid";
    if (g === "stack" || n === 1) return n === 1 ? "" : "stack";
    if (n === 2) return "g2";
    if (n >= 3) return g === "grid3" ? "g3" : "g2";
    return "";
  }

  /* عنوان الصفحة المستقلّة للمدخل — بلا شرطة، قابل للمشاركة */
  function pageURL(e) {
    return location.origin + location.pathname.replace(/[^\/]*$/, "") + "p/" + e.id + ".html";
  }

  /* أيقونات المشاركة المصغّرة — تُوضع في سطر التاريخ أعلى المدخل */
  function shareIcons(e) {
    var S = CFG.share || {}, url = pageURL(e);
    var t = encodeURIComponent(cut(e.t, 90) + "…"), u = encodeURIComponent(url);
    var h = '<span class="shx">';
    if (S.whatsapp) h += '<a href="https://wa.me/?text=' + t + "%20" + u +
      '" target="_blank" rel="noopener" title="واتساب" aria-label="مشاركة على واتساب">' + IC.wa + "</a>";
    if (S.x) h += '<a href="https://x.com/intent/tweet?text=' + t + "&url=" + u +
      '" target="_blank" rel="noopener" title="X" aria-label="مشاركة على X">' + IC.x + "</a>";
    if (S.telegram) h += '<a href="https://t.me/share/url?url=' + u + "&text=" + t +
      '" target="_blank" rel="noopener" title="تلغرام" aria-label="مشاركة على تلغرام">' + IC.tg + "</a>";
    if (S.facebook) h += '<a href="https://www.facebook.com/sharer/sharer.php?u=' + u +
      '" target="_blank" rel="noopener" title="فيسبوك" aria-label="مشاركة على فيسبوك">' + IC.fb + "</a>";
    if (S.copy !== false) h += '<button class="cpb" data-icon="1" data-url="' + url +
      '" title="نسخ الرابط" aria-label="نسخ الرابط">' + IC.cp + "</button>";
    return h + "</span>";
  }

  /* وصف الصورة يُشتقّ من أول النصّ — لقارئ الشاشة ولفهرسة الصور */
  function altOf(e) {
    var t = e.t.replace(/\s+/g, " ").trim();
    return att(t.length > 100 ? cut(t, 100) + "…" : t);
  }

  /* سهما الصعود والنزول — يظهران حين تطول الصفحة، ويخفت غير النافع منهما */
  var SUP = null;
  function supUpd() {
    if (!SUP) return;
    var h = document.documentElement.scrollHeight, v = window.innerHeight, y = window.scrollY || 0;
    SUP.style.display = h > v * 1.8 ? "flex" : "none";
    SUP.children[0].style.opacity = y > 220 ? "1" : ".35";
    SUP.children[1].style.opacity = y < h - v - 60 ? "1" : ".35";
  }
  function supMake() {
    if (SUP) return;
    SUP = document.createElement("div");
    SUP.className = "sup";
    SUP.innerHTML =
      '<button data-go="top" aria-label="إلى أعلى الصفحة" title="إلى الأعلى">' + IC.up + "</button>" +
      '<button data-go="end" aria-label="إلى أسفل الصفحة" title="إلى الأسفل">' + IC.down + "</button>";
    SUP.addEventListener("click", function (ev) {
      var b = ev.target.closest("button"); if (!b) return;
      window.scrollTo({ top: b.dataset.go === "top" ? 0 : document.documentElement.scrollHeight,
                        behavior: "smooth" });
    });
    document.body.appendChild(SUP);
    window.addEventListener("scroll", supUpd, { passive: true });
    window.addEventListener("resize", supUpd);
    supUpd();
  }

  function card(e, solo) {
    var isW = e.f === "waqfah", med = "", L = CFG.layout;
    if (e.m && e.m.length) {
      med = '<div class="med ' + galleryClass(e.m.length) + " " +
            (isW && L.wideMedia !== false ? "wide" : "") + '">' +
        e.m.map(function (m) {
          var a = m.alt ? att(m.alt) : altOf(e);
          if (m.v && m.vf && CFG.media.base)
            return '<figure><video controls preload="metadata" playsinline aria-label="' + a +
                   '" poster="' + CFG.media.base + "/" + m.f + '" src="' +
                   CFG.media.base + "/" + m.vf + '#t=0.5"></video></figure>';
          return '<figure><img loading="lazy" src="' + src(m) + '" alt="' + a + '"></figure>';
        }).join("") + "</div>";
    }
    var long = !solo && e.t.length > (L.clampChars || 600);
    /* أيقونات المشاركة في سطر التاريخ لكل المداخل، طويلها وقصيرها */
    var inline = !solo;
    var tstr = fmtTime(e.at);
    var meta = '<p class="meta">' + (solo ? e.d : '<a href="#/' + e.id + '">' + e.d + "</a>") +
      (tstr ? '<span class="dot">·</span>' + tstr : "") +
      (L.showReadingTime && e.t.length > 400 ? '<span class="dot">·</span>' + readTime(e.t) : "") +
      (e.draft ? '<span class="draft">مسوّدة</span>' : "") +
      (long ? '<a class="mk" href="#/' + e.id +
              '" title="النصّ أطول ممّا ترى — اضغط ليكتمل">' + IC.long + "نصّ طويل</a>" : "") +
      (inline ? shareIcons(e) : "") +
      (EDIT ? '<a class="pen' + (inline ? " after-shx" : "") + '" href="tahrir.html#/' + e.id +
              '" title="تحرير">' + IC.pen + "</a>" : "") +
      "</p>";
    var body = '<p class="tx' + (long ? " clamp" : "") + '">' + esc(e.t) + "</p>" +
      (long ? '<a class="cont" href="#/' + e.id + '">' + IC.down + "اقرأ التتمة</a>" : "");
    var endm = !long && CFG.layout.showEndMark !== false
      ? '<div class="end" aria-hidden="true"><i></i><span></span><i></i></div>' : "";
    return '<article class="e">' + meta + med + body + endm + "</article>";
  }

  function shareBar(e) {
    var S = CFG.share || {}, url = pageURL(e);
    var t = encodeURIComponent(cut(e.t, 90) + "…"), u = encodeURIComponent(url);
    var h = '<div class="share">';
    if (S.whatsapp) h += '<a href="https://wa.me/?text=' + t + "%20" + u + '" target="_blank" rel="noopener">' + IC.wa + "واتساب</a>";
    if (S.x) h += '<a href="https://x.com/intent/tweet?text=' + t + "&url=" + u + '" target="_blank" rel="noopener">' + IC.x + "X</a>";
    if (S.telegram) h += '<a href="https://t.me/share/url?url=' + u + "&text=" + t + '" target="_blank" rel="noopener">' + IC.tg + "تلغرام</a>";
    if (S.facebook) h += '<a href="https://www.facebook.com/sharer/sharer.php?u=' + u + '" target="_blank" rel="noopener">' + IC.fb + "فيسبوك</a>";
    if (S.copy !== false) h += '<button class="cpb" data-url="' + url + '" id="cpbtn">' + IC.cp + "نسخ الرابط</button>";
    return h + "</div>";
  }

  function aboutPage() {
    var s = CFG.site;
    var bio = CFG.doors.map(function (d) {
      return '<span class="subj">' + esc(d.subj) + "</span>" +
             (d.pred ? ' <span class="pred">' + esc(d.pred) + "</span>" : "");
    }).join(' <span class="sep">|</span> ');
    return '<div class="about">' +
      (s.portrait ? '<img src="' + esc(s.portrait) + '" alt="' + esc(s.name) + '" width="200" height="200">' : "") +
      '<p class="lead">' + esc(s.about) + "</p>" +
      '<div class="fl" aria-hidden="true"><i></i><span class="lz"></span><i></i></div>' +
      '<p class="bio">' + bio + "</p>" +
      '<p class="sig">' + esc(s.tagline) + "</p>" +
      '<p class="meta2">' +
      (s.contactUrl ? 'للتواصل: <a href="' + esc(s.contactUrl) + '" target="_blank" rel="noopener">' + esc(s.contactLabel) + "</a><br>" : "") +
      esc(s.location || "") + "</p></div>";
  }

  function filtered() {
    var nq = query ? norm(query) : "";
    return DATA.filter(function (e) {
      return !e.draft &&
        (form === "all" ? true
          : form === "sel" ? e.t.length > ((CFG.layout && CFG.layout.selectedChars) || 900)
          : e.f === form) &&
        (!nq || (NORM[e.id] || "").indexOf(nq) > -1);
    });
  }
  function render() {
    var list = filtered(), s = $("stream"), more = $("more");
    if (!list.length) { s.innerHTML = '<p class="none">لا مداخل هنا بعد.</p>'; more.style.display = "none"; $("hits").textContent = ""; return; }
    if (shown === 0) s.innerHTML = "";
    var n = list.slice(shown, shown + (CFG.layout.perPage || 25));
    s.insertAdjacentHTML("beforeend", n.map(function (e) { return card(e, false); }).join(""));
    shown += n.length;
    more.style.display = shown < list.length ? "block" : "none";
    more.textContent = "المزيد (" + arn(list.length - shown) + ")";
    $("hits").textContent = query ? arn(list.length) + " نتيجة لـ«" + query + "»" : "";
    supMake(); setTimeout(supUpd, 60);
  }
  $("more").onclick = function () { render(); };
  var tmr = null;
  $("q").addEventListener("input", function () {
    var el = this;
    clearTimeout(tmr);
    tmr = setTimeout(function () { query = el.value.trim(); location.hash = "#/"; shown = 0; render(); }, 220);
  });

  document.addEventListener("click", function (ev) {
    var b = ev.target.closest(".cpb"); if (!b) return;
    ev.preventDefault();
    var url = b.dataset.url, o = b.innerHTML, icon = b.dataset.icon === "1";
    var done = function () {
      b.innerHTML = icon ? IC.ok : "نُسخ ✓";
      setTimeout(function () { b.innerHTML = o; }, 1600);
    };
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, done);
    else { var i = document.createElement("input"); i.value = url; document.body.appendChild(i); i.select();
           try { document.execCommand("copy"); } catch (x) {} i.remove(); done(); }
  });

  function route() {
    /* يقبل «#/رقم» و«#/p/رقم.html» معاً، فلا تضيع الروابط القديمة */
    var h = location.hash.replace("#/", "").trim().replace(/^p\//, "").replace(/\.html$/, "");
    var app = $("app");
    var old = $("solo"); if (old) old.remove();
    if (h === "archive") {
      app.style.display = "none";
      var by = {};
      DATA.filter(function (e) { return !e.draft; }).forEach(function (e) {
        var y = e.iso.slice(0, 4); (by[y] = by[y] || []).push(e);
      });
      var years = Object.keys(by).sort().reverse();
      var html = years.map(function (y) {
        return '<h2 style="font-family:var(--display);font-weight:400;color:var(--accent);' +
          'font-size:calc(var(--body)*1.1);margin:30px 0 4px;padding-top:18px;' +
          'border-top:1px solid var(--gold)">' + arn(y) + " <span style=\"font-size:.7em;color:var(--muted)\">" +
          arn(by[y].length) + "</span></h2><ul style=\"list-style:none;padding:0;margin:0\">" +
          by[y].map(function (e) {
            return '<li style="padding:8px 0;border-top:var(--rulew) solid var(--rule)">' +
              '<a href="#/' + e.id + '">' + esc(cut(e.t, 68)) + "…</a></li>";
          }).join("") + "</ul>";
      }).join("");
      document.body.insertAdjacentHTML("afterbegin",
        '<div id="solo"><a class="back" href="#/">→ العودة إلى المدونة</a><main>' + html + "</main></div>");
      window.scrollTo(0, 0); return;
    }
    if (h === "about") {
      app.style.display = "none";
      document.body.insertAdjacentHTML("afterbegin",
        '<div id="solo"><a class="back" href="#/">→ العودة إلى المدونة</a><main>' + aboutPage() + "</main></div>");
      window.scrollTo(0, 0); return;
    }
    if (h) {
      var e = DATA.filter(function (x) { return x.id === h; })[0];
      if (e) {
        app.style.display = "none";
        document.body.insertAdjacentHTML("afterbegin",
          '<div id="solo"><a class="back" href="#/">→ العودة إلى المدونة</a><main>' +
          card(e, true) + shareBar(e) + "</main></div>");
        window.scrollTo(0, 0); return;
      }
    }
    document.title = CFG.site.name;
    app.style.display = "";
  }
  window.addEventListener("hashchange", route);
  window.addEventListener("hashchange", function () { setTimeout(supUpd, 80); });

  /* ---------- الإقلاع ---------- */
  /* التحميل على دفعتين: الأحدث أولاً ليقرأ الزائر فوراً، ثم الأرشيف كاملاً في الخلف */
  var FULL = false;
  function ingest(list) {
    DATA = list; NORM = {};
    DATA.forEach(function (e) { NORM[e.id] = norm(e.t); });
  }
  function loadFull(first) {
    return fetch("data.json", { cache: "no-cache" }).then(function (r) { return r.json(); })
      .then(function (all) {
        var keep = shown;
        ingest(all); FULL = true;
        $("q").placeholder = "ابحث في " + arn(DATA.length) + " نصّاً…";
        $("q").disabled = false;
        if (first) { buildMast(); shown = 0; render(); route(); analytics(CFG); return; }
        shown = 0; render();
        while (shown < keep && $("more").style.display !== "none") render();
        if (!$("hits").textContent) $("hits").textContent = "";
        route();
      });
  }

  fetch("config.json", { cache: "no-cache" }).then(function (r) { return r.json(); })
    .then(function (cfg) {
      CFG = cfg; loadFonts(CFG); applyTheme(CFG);
      return fetch("data-recent.json", { cache: "no-cache" })
        .then(function (r) { return r.ok ? r.json() : null; })
        .catch(function () { return null; });
    })
    .then(function (part) {
      if (!part || !part.length) return loadFull(true);
      ingest(part); buildMast(); render(); route(); analytics(CFG);
      $("q").disabled = true;
      $("q").placeholder = "جارٍ تحميل الأرشيف…";
      return loadFull(false);
    })
    .catch(function (err) {
      $("stream").innerHTML = '<p class="none">تعذّر تحميل المدونة.<br>' + esc(err.message) + "</p>";
    });

  if ("serviceWorker" in navigator)
    window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
})();
