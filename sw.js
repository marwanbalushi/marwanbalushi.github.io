/* عامل الخدمة — شبكة أولاً، والتخزين احتياط عند انقطاعها.
   لا يخزّن البيانات ولا صفحات المداخل، فلا يبقى القارئ على نسخة قديمة أبداً. */
var V = "mb-v4";
var SHELL = ["./", "./index.html", "./portrait.jpg", "./icon-192.png", "./icon-512.png",
             "./apple-touch-icon.png", "./manifest.json", "./card.jpg"];

self.addEventListener("install", function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(V).then(function (c) {
    return Promise.all(SHELL.map(function (u) { return c.add(u).catch(function () {}); }));
  }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== V; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url;
  try { url = new URL(req.url); } catch (x) { return; }
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(req).then(function (res) {
      if (res && res.status === 200 && res.type === "basic" &&
          !/\.(json|xml)$/.test(url.pathname) && url.pathname.indexOf("/p/") !== 0) {
        var copy = res.clone();
        caches.open(V).then(function (c) { c.put(req, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (hit) {
        return hit || caches.match("./index.html");
      });
    })
  );
});
