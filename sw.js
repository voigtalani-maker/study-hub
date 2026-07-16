/* Study Hub service worker — offline app shell, no push notifications.
   Bump CACHE when index.html or the shell changes so old copies are dropped. */
const CACHE = 'studyhub-shell-v4';
const SUPABASE_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';

// Cache the app shell on install. Local files must all cache for install to
// succeed; the CDN script is best-effort so a CDN hiccup can't block install.
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(['./', './index.html']).then(function () {
        return cache.add(SUPABASE_JS).catch(function () {});
      });
    }).then(function () { return self.skipWaiting(); })
  );
});

// Drop old caches when a new worker takes over.
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') { return; }

  var url = new URL(req.url);

  // Never touch Supabase auth/data traffic — it must always hit the network so
  // logins and saves are live. Offline, these fail and the app's own toast shows.
  if (url.hostname.endsWith('supabase.co')) { return; }

  // Page loads: network-first so a redeploy is picked up, falling back to the
  // cached shell when offline.
  // `cache:'no-cache'` forces a revalidation against the server instead of
  // reading the browser's HTTP cache. GitHub Pages serves the shell with
  // `max-age=600`, so a plain fetch() here could hand back a 10-minute-old
  // page and a fresh deploy would look like it hadn't landed. Revalidating is
  // cheap (a 304 when nothing changed) and makes redeploys show up at once.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put('./index.html', copy); });
        return res;
      }).catch(function () {
        return caches.match('./index.html');
      })
    );
    return;
  }

  // Everything else (icons, the CDN script): cache-first, backfill on miss.
  event.respondWith(
    caches.match(req).then(function (hit) {
      return hit || fetch(req).then(function (res) {
        if (res && res.status === 200 && url.protocol === 'https:') {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      });
    })
  );
});
