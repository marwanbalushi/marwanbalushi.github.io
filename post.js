/* صفحة مدخل مستقلة — تقرأ الهوية من config.json وتعرض المدخل المضمَّن */
(function () {
  var E = window.__ENTRY__ || {}, R = document.documentElement;
  var arn = function (n) { return String(n).replace(/\d/g, function (d) { return "٠١٢٣٤٥٦٧٨٩"[d]; }); };
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
  function rd(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  R.setAttribute("data-theme", rd("theme") ||
    (window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  R.setAttribute("data-contrast", rd("contrast") || "normal");
  R.setAttribute("data-clarity", rd("clarity") || "normal");
  R.setAttribute("data-color", rd("color") || "full");
  var sc = parseFloat(rd("scale")); if (sc) R.style.setProperty("--scale", sc);

  fetch("../config.json?v=" + Date.now()).then(function (r) { return r.json(); }).then(function (CFG) {
    var t = CFG.type, L = CFG.theme.light, D = CFG.theme.dark;
    function vars(o) { return Object.keys(o).map(function (k) { return "--" + k + ":" + o[k]; }).join(";"); }
    var st = document.createElement("style");
    st.textContent = ":root{" + vars(L) + ";--sizeM:" + t.sizeMobile + "px;--sizeD:" + t.sizeDesktop +
      "px;--lh:" + t.lineHeight + ";--measure:" + t.measure + "em;" +
      '--display:"' + t.display + '",serif;--text:"' + t.text + '",serif}' +
      "[data-theme=dark]{" + vars(D) + "}";
    document.head.appendChild(st);

    var fams = [t.display, t.text].filter(function (v, i, a) { return a.indexOf(v) === i; });
    var lk = document.createElement("link"); lk.rel = "stylesheet";
    lk.href = "https://fonts.googleapis.com/css2?" + fams.map(function (f) {
      return "family=" + encodeURIComponent(f).replace(/%20/g, "+") + ":wght@400;700";
    }).join("&") + "&display=swap";
    document.head.appendChild(lk);

    var med = "";
    if (E.m && E.m.length) {
      var g = E.m.length === 1 ? "" : (CFG.layout.gallery === "grid3" && E.m.length >= 3 ? "g3" : "g2");
      med = '<div class="med ' + g + '">' + E.m.map(function (m) {
        if (m.v && m.vf) return '<figure><video controls preload="metadata" playsinline src="' +
          CFG.media.base + "/" + m.vf + '#t=0.5"></video></figure>';
        return '<figure><img loading="lazy" src="' + CFG.media.base + "/" + m.f + '" alt=""></figure>';
      }).join("") + "</div>";
    }
    var rt = CFG.layout.showReadingTime !== false && E.t.length > 400
      ? '<span class="dot">·</span>' + arn(Math.max(1, Math.round(E.t.trim().split(/\s+/).length / 180))) + " دقيقة قراءة" : "";

    document.getElementById("bar").innerHTML = '<a href="../index.html">' + esc(CFG.site.name) + "</a>";
    document.getElementById("post").innerHTML =
      '<article class="e"><p class="meta">' + esc(E.d) +
      (E.dk ? '<span class="dot">·</span><span class="dr">' + esc(E.door) + "</span>" : "") + rt + "</p>" +
      med + '<p class="tx">' + esc(E.t) + "</p>" +
      (CFG.layout.showEndMark !== false ? '<div class="end"><i></i><span></span><i></i></div>' : "") +
      "</article>";

    var S = CFG.share || {}, url = location.href.split("#")[0];
    var tw = encodeURIComponent(E.t.slice(0, 90).replace(/\n/g, " ") + "…"), u = encodeURIComponent(url);
    var h = "";
    if (S.whatsapp) h += '<a href="https://wa.me/?text=' + tw + "%20" + u + '" target="_blank" rel="noopener">واتساب</a>';
    if (S.x) h += '<a href="https://x.com/intent/tweet?text=' + tw + "&url=" + u + '" target="_blank" rel="noopener">X</a>';
    if (S.telegram) h += '<a href="https://t.me/share/url?url=' + u + "&text=" + tw + '" target="_blank" rel="noopener">تلغرام</a>';
    if (S.facebook) h += '<a href="https://www.facebook.com/sharer/sharer.php?u=' + u + '" target="_blank" rel="noopener">فيسبوك</a>';
    if (S.copy !== false) h += '<button id="cp">نسخ الرابط</button>';
    document.getElementById("share").innerHTML = h;
    var cp = document.getElementById("cp");
    if (cp) cp.onclick = function () {
      var o = cp.textContent;
      var done = function () { cp.textContent = "نُسخ ✓"; setTimeout(function () { cp.textContent = o; }, 1600); };
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, done);
    };
  }).catch(function () {
    document.getElementById("post").innerHTML =
      '<article class="e"><p class="meta">' + esc(E.d) + '</p><p class="tx">' + esc(E.t) + "</p></article>";
  });
})();
