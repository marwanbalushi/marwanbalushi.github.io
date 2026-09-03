/* محرّك عرض المدونة — كل شيء فيه يُقاد من config.json */
(function () {
  var R = document.documentElement, $ = function (i) { return document.getElementById(i); };
  var CFG = null, DATA = [], form = "all", door = null, query = "", shown = 0, EDIT = false, SC = 1;
  var arn = function (n) { return String(n).replace(/\d/g, function (d) { return "٠١٢٣٤٥٦٧٨٩"[d]; }); };
  function st(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function rd(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }

  try { EDIT = !!(rd("ghtok") || rd("ghunlocked")); } catch (e) {}
  if (EDIT) { $("compose").classList.remove("hide"); $("ctrl").classList.remove("hide"); }

  /* ---------- الأيقونات ---------- */
  var IC = {
    long: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16M4 10h16M4 15h16M4 20h9"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
    pen:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
    x:    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.2 2H21l-6.6 7.5L22 22h-6.2l-4.8-6.3L5.4 22H2.6l7-8L2 2h6.3l4.4 5.8zM17 20.3h1.6L7.1 3.6H5.4z"/></svg>',
    wa:   '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20zm4.5-5.9c-.2-.1-1.4-.7-1.7-.8s-.4-.1-.5.1-.6.8-.7.9-.3.2-.5 0a6.5 6.5 0 0 1-3.2-2.8c-.2-.4.2-.4.6-1.2a.5.5 0 0 0 0-.4c0-.1-.5-1.3-.7-1.7s-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11 11 0 0 0 4.3 3.8c1.6.6 2.2.7 3 .6a2.5 2.5 0 0 0 1.7-1.2 2 2 0 0 0 .2-1.2c-.1-.1-.3-.2-.5-.3z"/></svg>',
    fb:   '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7h-2.5V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z"/></svg>',
    tg:   '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.9 4.3 18.7 19c-.2 1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.4-5 9.1-8.2c.4-.4-.1-.6-.6-.2L6.3 12.8 1.5 11.3c-1-.3-1-1 .2-1.5l18.9-7.3c.9-.3 1.6.2 1.3 1.8z"/></svg>',
    cp:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'
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
      "[data-theme=dark]{" + vars(D) + "}";
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
      h += '<a class="avlink" href="#/about" aria-label="' + esc(s.avatarCaption || "عن الكاتب") + '">' +
        '<img class="avatar" src="' + esc(s.portrait) + '" alt="' + esc(s.name) + '" ' +
        'style="width:' + (s.avatarSize || 66) + "px;height:" + (s.avatarSize || 66) + 'px" loading="lazy">' +
        '<span class="avcap">' + esc(s.avatarCaption || "عن الكاتب") + "</span></a>";
    }
    h += '<div class="fl" aria-hidden="true"><i></i><span class="lz"></span><i></i></div>' +
         '<nav class="doors" id="doors" aria-label="أبواب المدونة"></nav>' +
         '<p class="tag">' + esc(s.tagline) + "</p>";
    $("mast").innerHTML = h;

    var dn = $("doors");
    CFG.doors.forEach(function (d, i) {
      if (i) dn.insertAdjacentHTML("beforeend", '<span class="sep">|</span>');
      var full = d.pred ? d.subj + " " + d.pred : d.subj;
      dn.insertAdjacentHTML("beforeend",
        '<b data-d="' + esc(full) + '"><span class="subj">' + esc(d.subj) + "</span>" +
        (d.pred ? ' <span class="pred">' + esc(d.pred) + "</span>" : "") + "</b>");
    });
    dn.onclick = function (e) {
      var b = e.target.closest("b"); if (!b) return;
      location.hash = "#/";
      door = door === b.dataset.d ? null : b.dataset.d;
      dn.querySelectorAll("b").forEach(function (x) {
        x.classList.toggle("off", !!door && x.dataset.d !== door);
        x.classList.toggle("sel", door === x.dataset.d);
      });
      shown = 0; render();
    };

    var fb = $("forms"); fb.innerHTML = "";
    Object.keys(CFG.forms).forEach(function (k) {
      fb.insertAdjacentHTML("beforeend",
        '<button data-f="' + k + '"' + (k === "all" ? ' class="on"' : "") + ">" + esc(CFG.forms[k]) + "</button>");
    });
    fb.querySelectorAll("button").forEach(function (b) {
      b.onclick = function () {
        location.hash = "#/"; form = b.dataset.f;
        fb.querySelectorAll("button").forEach(function (x) { x.classList.toggle("on", x === b); });
        shown = 0; render();
      };
    });

    $("q").placeholder = "ابحث في " + arn(DATA.length) + " نصّاً…";
    $("foot").innerHTML = '<div class="fl" aria-hidden="true"><i></i><span class="lz"></span><i></i></div>' +
      esc(CFG.site.name) + (CFG.site.location ? " · " + esc(CFG.site.location) : "");
  }

  /* ---------- المداخل ---------- */
  function src(m) { return CFG.media.base ? CFG.media.base + "/" + m.f : m.u; }
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

  function card(e, solo) {
    var isW = e.f === "waqfah", med = "", L = CFG.layout;
    if (e.m && e.m.length) {
      med = '<div class="med ' + galleryClass(e.m.length) + " " +
            (isW && L.wideMedia !== false ? "wide" : "") + '">' +
        e.m.map(function (m) {
          if (m.v && m.vf && CFG.media.base)
            return '<figure><video controls preload="metadata" playsinline src="' +
                   CFG.media.base + "/" + m.vf + '#t=0.5"></video></figure>';
          return '<figure><img loading="lazy" src="' + src(m) + '" alt=""></figure>';
        }).join("") + "</div>";
    }
    var long = !solo && e.t.length > (L.clampChars || 600);
    var meta = '<p class="meta">' + (solo ? e.d : '<a href="#/' + e.id + '">' + e.d + "</a>") +
      (e.dk ? '<span class="dot">·</span><span class="dr">' + esc(e.door) + "</span>" : "") +
      (L.showReadingTime && e.t.length > 400 ? '<span class="dot">·</span>' + readTime(e.t) : "") +
      (e.draft ? '<span class="draft">مسوّدة</span>' : "") +
      (long ? '<a class="mk" href="#/' + e.id + '" title="نصّ طويل">' + IC.long + "</a>" : "") +
      (EDIT ? '<a class="pen" href="tahrir.html#/' + e.id + '" title="تحرير">' + IC.pen + "</a>" : "") +
      "</p>";
    var body = '<p class="tx' + (long ? " clamp" : "") + '">' + esc(e.t) + "</p>" +
      (long ? '<a class="cont" href="#/' + e.id + '">' + IC.down + "اقرأ التتمة</a>" : "");
    var endm = !long && CFG.layout.showEndMark !== false
      ? '<div class="end" aria-hidden="true"><i></i><span></span><i></i></div>' : "";
    return '<article class="e">' + meta + med + body + endm + "</article>";
  }

  function shareBar(e) {
    var S = CFG.share || {}, url = location.origin + location.pathname + "#/" + e.id;
    var t = encodeURIComponent(e.t.slice(0, 90).replace(/\n/g, " ") + "…"), u = encodeURIComponent(url);
    var h = '<div class="share">';
    if (S.whatsapp) h += '<a href="https://wa.me/?text=' + t + "%20" + u + '" target="_blank" rel="noopener">' + IC.wa + "واتساب</a>";
    if (S.x) h += '<a href="https://x.com/intent/tweet?text=' + t + "&url=" + u + '" target="_blank" rel="noopener">' + IC.x + "X</a>";
    if (S.telegram) h += '<a href="https://t.me/share/url?url=' + u + "&text=" + t + '" target="_blank" rel="noopener">' + IC.tg + "تلغرام</a>";
    if (S.facebook) h += '<a href="https://www.facebook.com/sharer/sharer.php?u=' + u + '" target="_blank" rel="noopener">' + IC.fb + "فيسبوك</a>";
    if (S.copy !== false) h += '<button data-url="' + url + '" id="cpbtn">' + IC.cp + "نسخ الرابط</button>";
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
    return DATA.filter(function (e) {
      return !e.draft &&
        (form === "all" || e.f === form) &&
        (!door || e.door === door) &&
        (!query || e.t.indexOf(query) > -1);
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
  }
  $("more").onclick = function () { render(); };
  var tmr = null;
  $("q").addEventListener("input", function () {
    var el = this;
    clearTimeout(tmr);
    tmr = setTimeout(function () { query = el.value.trim(); location.hash = "#/"; shown = 0; render(); }, 220);
  });

  document.addEventListener("click", function (ev) {
    var b = ev.target.closest("#cpbtn"); if (!b) return;
    var url = b.dataset.url, o = b.innerHTML;
    var done = function () { b.textContent = "نُسخ ✓"; setTimeout(function () { b.innerHTML = o; }, 1600); };
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, done);
    else { var i = document.createElement("input"); i.value = url; document.body.appendChild(i); i.select();
           try { document.execCommand("copy"); } catch (x) {} i.remove(); done(); }
  });

  function route() {
    var h = location.hash.replace("#/", "").trim(), app = $("app");
    var old = $("solo"); if (old) old.remove();
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
    app.style.display = "";
  }
  window.addEventListener("hashchange", route);

  /* ---------- الإقلاع ---------- */
  Promise.all([
    fetch("config.json?v=" + Date.now()).then(function (r) { return r.json(); }),
    fetch("data.json?v=" + Date.now()).then(function (r) { return r.json(); })
  ]).then(function (res) {
    CFG = res[0]; DATA = res[1];
    loadFonts(CFG); applyTheme(CFG); buildMast(); render(); route(); analytics(CFG);
  }).catch(function (err) {
    $("stream").innerHTML = '<p class="none">تعذّر تحميل المدونة.<br>' + esc(err.message) + "</p>";
  });

  if ("serviceWorker" in navigator)
    window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
})();
