/* Office Web PWA - cache per uso offline */
var CACHE = 'office-web-v5';
var CORE = [
  './',
  './index.html',
  './mobile.css',
  './pwa.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './fonts/KaTeX_AMS-Regular.woff2',
  './fonts/KaTeX_Caligraphic-Bold.woff2',
  './fonts/KaTeX_Caligraphic-Regular.woff2',
  './fonts/KaTeX_Fraktur-Bold.woff2',
  './fonts/KaTeX_Fraktur-Regular.woff2',
  './fonts/KaTeX_Main-Bold.woff2',
  './fonts/KaTeX_Main-BoldItalic.woff2',
  './fonts/KaTeX_Main-Italic.woff2',
  './fonts/KaTeX_Main-Regular.woff2',
  './fonts/KaTeX_Math-BoldItalic.woff2',
  './fonts/KaTeX_Math-Italic.woff2',
  './fonts/KaTeX_SansSerif-Bold.woff2',
  './fonts/KaTeX_SansSerif-Italic.woff2',
  './fonts/KaTeX_SansSerif-Regular.woff2',
  './fonts/KaTeX_Script-Regular.woff2',
  './fonts/KaTeX_Size1-Regular.woff2',
  './fonts/KaTeX_Size2-Regular.woff2',
  './fonts/KaTeX_Size3-Regular.woff2',
  './fonts/KaTeX_Size4-Regular.woff2',
  './fonts/KaTeX_Typewriter-Regular.woff2'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches
      .open(CACHE)
      .then(function (cache) {
        return cache.addAll(CORE);
      })
      .then(function () {
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys
            .filter(function (key) {
              return key !== CACHE;
            })
            .map(function (key) {
              return caches.delete(key);
            })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

function staleWhileRevalidate(request) {
  return caches.open(CACHE).then(function (cache) {
    return cache.match(request).then(function (cached) {
      var network = fetch(request)
        .then(function (response) {
          if (response && (response.ok || response.type === 'opaque')) {
            cache.put(request, response.clone());
          }
          return response;
        })
        .catch(function () {
          return null;
        });

      return cached || network.then(function (response) {
        return response || Response.error();
      });
    });
  });
}

function networkFirst(request) {
  return caches.open(CACHE).then(function (cache) {
    return fetch(request)
      .then(function (response) {
        if (response && response.ok) {
          cache.put('./index.html', response.clone());
        }
        return response;
      })
      .catch(function () {
        return cache.match(request).then(function (cached) {
          return cached || cache.match('./index.html');
        });
      });
  });
}

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;

  var url;
  try {
    url = new URL(request.url);
  } catch (err) {
    return;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  /* I font KaTeX arrivano da CDN: li conserviamo per l'uso offline. */
  if (
    url.hostname === 'cdn.jsdelivr.net' &&
    url.pathname.indexOf('/npm/katex@') !== -1
  ) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
