/* عامل الخدمة — يخزّن الصور والأيقونات وحدها.
   ولا يمسّ الشيفرة ولا البيانات ولا الصفحات، فلا يعلق قارئ على نسخة قديمة. */
var V = "mb-v6";
var KEEP = /\.(png|jpe?g|webp|gif|svg|ico|woff2?)$/i;

self.addEventListener("install", function (e) { self.skipWaiting(); });

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

  /* الشيفرة والبيانات والصفحات: شبكة دائماً، بلا وسيط */
  if (!KEEP.test(url.pathname)) return;

  /* الصور: من التخزين إن وُجدت، وإلا من الشبكة ثم تُخزَّن */
  e.respondWith(
    caches.match(req).then(function (hit) {
      return hit || fetch(req).then(function (res) {
        if (res && res.status === 200 && res.type === "basic") {
          var copy = res.clone();
          caches.open(V).then(function (c) { c.put(req, copy); });
        }
        return res;
      });
    }).catch(function () { return fetch(req); })
  );
});
