/* عامل الخدمة — يجعل المدونة تفتح بلا إنترنت */
var V     = 'mb-v4';
var SHELL = ['./index.html','./tahrir.html','./radud.html','./404.html',
             './manifest.json','./icon-192.png','./icon-512.png'];

self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(V).then(function(c){
    return Promise.all(SHELL.map(function(u){
      return c.add(u).catch(function(){});   // لا نُفشل التثبيت بسبب ملف واحد
    }));
  }));
});

self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.map(function(k){ if(k!==V) return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener('fetch', function(e){
  var req = e.request, url = new URL(req.url);
  if(req.method !== 'GET') return;

  // الوسائط الثقيلة ونداءات التحليلات تمرّ ولا تُخزَّن
  if(url.hostname.indexOf('r2.dev') > -1) return;
  if(url.hostname.indexOf('cloudflareinsights') > -1) return;

  // البيانات: الشبكة أولاً كي تظهر تعديلاتك فوراً، والمخزون احتياطاً
  if(url.pathname.indexOf('data.json') > -1 || url.pathname.indexOf('radud.json') > -1){
    e.respondWith(
      fetch(req).then(function(r){
        var cp = r.clone();
        caches.open(V).then(function(c){ c.put(url.pathname, cp); });
        return r;
      }).catch(function(){ return caches.match(url.pathname); })
    );
    return;
  }

  // الخطوط: المخزون أولاً
  if(url.hostname.indexOf('fonts.g') > -1){
    e.respondWith(caches.match(req).then(function(m){
      return m || fetch(req).then(function(r){
        var cp = r.clone();
        caches.open(V).then(function(c){ c.put(req, cp); });
        return r;
      });
    }));
    return;
  }

  // بقية ملفات الموقع: المخزون أولاً مع تحديث صامت
  if(url.origin === location.origin){
    e.respondWith(caches.match(req).then(function(m){
      var net = fetch(req).then(function(r){
        var cp = r.clone();
        caches.open(V).then(function(c){ c.put(req, cp); });
        return r;
      }).catch(function(){ return m; });
      return m || net;
    }));
  }
});
